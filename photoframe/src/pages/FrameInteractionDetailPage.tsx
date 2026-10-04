import { CaretLeft, Play } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FrameElderReplyPanel } from "../components/FrameElderReplyPanel";
import { FramePageShell, useFrameDisplayMode } from "../components/FrameShell";
import { getActiveScenarioId, withScenario } from '../content/scenarioStore'
import {
  getMockInteractionThreadById,
  getMockInteractionThreads,
  getMockMembers,
} from "../mock";
import type { FamilyMember, InteractionResponse } from "../types";
import { getMemberAvatarSrc, getMemberAvatarSrcByName } from "../utils/familyAvatars";

const AMA_PDF_RESPONSE_THREAD_IDS = new Set(["thread-008", "thread-013", "thread-018"]);

function formatDetailTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date("2026-05-27T10:20:00+08:00");
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays === 0) return `今天 ${time}`;
  if (diffDays === 1) return `昨天 ${time}`;
  if (diffDays === 2) return `前天 ${time}`;
  if (date.getFullYear() === now.getFullYear())
    return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
}

function getSenderLabel(member?: FamilyMember, fallbackName?: string) {
  return (
    member?.avatar ||
    member?.name.slice(0, 1) ||
    fallbackName?.slice(0, 1) ||
    ""
  );
}

export function FrameInteractionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mode } = useFrameDisplayMode();
  const members = getMockMembers();
  const thread =
    getMockInteractionThreadById(id || "") ?? getMockInteractionThreads()[0];
  const usesAmaPdfResponses =
    getActiveScenarioId() === "ama-letter" &&
    AMA_PDF_RESPONSE_THREAD_IDS.has(thread.id);
  const [photoOrientation, setPhotoOrientation] = useState<
    "landscape" | "portrait" | "square"
  >("landscape");
  const [playingVoice, setPlayingVoice] = useState<{
    id: string;
    durationSeconds: number;
    remainingSeconds: number;
  } | null>(null);
  const [topbarPinned, setTopbarPinned] = useState(false);
  const layoutRef = useRef<HTMLElement | null>(null);
  const threadAreaRef = useRef<HTMLElement | null>(null);
  const replyPanelRef = useRef<HTMLElement | null>(null);

  const timeline = useMemo<InteractionResponse[]>(
    () =>
      [...thread.responses].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [thread.responses],
  );
  const replyTimeline = useMemo(
    () =>
      timeline
        .filter((response, index) => {
          if (index !== 0) return true;
          if (response.authorId !== thread.senderId) return true;
          if (thread.initialMethod === "voice" && response.method === "voice")
            return false;
          return response.content.trim() !== thread.initialContent.trim();
        })
        .sort(
          (a, b) =>
            usesAmaPdfResponses
              ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [thread.initialContent, thread.initialMethod, thread.senderId, timeline, usesAmaPdfResponses],
  );
  const firstResponseTime = timeline[0]?.createdAt || thread.latestAt;
  const initialVoiceDurationSeconds =
    thread.initialMethod === "voice"
      ? timeline.find(
          (response) =>
            response.authorId === thread.senderId &&
            response.method === "voice",
        )?.durationSeconds
      : undefined;

  useEffect(() => {
    setPhotoOrientation("landscape");
    setPlayingVoice(null);
    setTopbarPinned(false);
  }, [id]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll =
      document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior =
        previousHtmlOverscroll;
    };
  }, []);

  useEffect(() => {
    const layout = layoutRef.current;
    const threadArea = threadAreaRef.current;
    const replyPanel = replyPanelRef.current;
    if (!layout || !threadArea || !replyPanel) return undefined;

    const updateTopbarState = () => {
      syncTopbarPinned();
    };

    updateTopbarState();
    layout.addEventListener("scroll", updateTopbarState, { passive: true });
    threadArea.addEventListener("scroll", updateTopbarState, { passive: true });
    replyPanel.addEventListener("scroll", updateTopbarState, { passive: true });

    return () => {
      layout.removeEventListener("scroll", updateTopbarState);
      threadArea.removeEventListener("scroll", updateTopbarState);
      replyPanel.removeEventListener("scroll", updateTopbarState);
    };
  }, [id]);

  useEffect(() => {
    if (!playingVoice) return undefined;
    const timer = window.setInterval(() => {
      setPlayingVoice((current) => {
        if (!current) return null;
        const nextRemaining = current.remainingSeconds - 1;
        return nextRemaining > 0
          ? { ...current, remainingSeconds: nextRemaining }
          : null;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playingVoice?.id]);

  const renderAvatar = (authorId: string, authorName: string) => {
    const member = members.find((item) => item.id === authorId);
    const label = getSenderLabel(member, authorName);
    const avatarSrc = getMemberAvatarSrc(member?.id || authorId) || getMemberAvatarSrcByName(authorName);
    return (
      <span
        className={avatarSrc ? "thread-avatar thread-avatar--image" : "thread-avatar"}
        aria-label={`${member?.name || authorName}的头像`}
      >
        {avatarSrc ? <img src={avatarSrc} alt="" aria-hidden="true" draggable={false} /> : <span>{label}</span>}
      </span>
    );
  };

  const renderVoiceIcon = (isPlaying: boolean) =>
    isPlaying ? (
      <i className="home-voice-wave">
        <b />
        <b />
        <b />
      </i>
    ) : (
      <Play size={10} weight="fill" />
    );

  const toggleVoicePlayback = (voiceId: string, durationSeconds?: number) => {
    const normalizedDuration = Math.max(1, durationSeconds || 1);
    setPlayingVoice((current) =>
      current?.id === voiceId
        ? null
        : {
            id: voiceId,
            durationSeconds: normalizedDuration,
            remainingSeconds: normalizedDuration,
          },
    );
  };

  const syncTopbarPinned = () => {
    const layout = layoutRef.current;
    const threadArea = threadAreaRef.current;
    const replyPanel = replyPanelRef.current;
    setTopbarPinned(
      Boolean(
        (layout?.scrollTop || 0) > 8 ||
        (threadArea?.scrollTop || 0) > 8 ||
        (replyPanel?.scrollTop || 0) > 8,
      ),
    );
  };

  const syncTopbarPinnedAfterRightScroll = () => {
    setTopbarPinned(true);
  };

  const renderVoiceLabel = (voiceId: string, durationSeconds?: number) => {
    if (playingVoice?.id === voiceId)
      return `${String(playingVoice.remainingSeconds).padStart(2, "0")}”`;
    return durationSeconds ? `${durationSeconds}”` : "";
  };

  return (
    <FramePageShell
      className="frame-space-page frame-family-space frame-detail-tablet-page frame-light-nav-page"
      mode={mode}
    >
      <header
        className={
          topbarPinned
            ? "frame-memory-topbar frame-family-space__topbar frame-detail-topbar frame-light-nav is-pinned"
            : "frame-memory-topbar frame-family-space__topbar frame-detail-topbar frame-light-nav"
        }
      >
        <button
          className="frame-memory-back-button"
          type="button"
          aria-label="返回家庭空间"
          onClick={() => navigate(withScenario("/frame/family"))}
        >
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>互动详情</h1>
      </header>

      <section className="frame-detail-tablet-layout" ref={layoutRef}>
        <section
          className="thread-dialog-area frame-detail-thread-area"
          aria-label="互动内容"
          ref={threadAreaRef}
        >
          <article className="thread-memory-post" aria-label="首个互动">
            <div className="thread-memory-post__meta">
              {renderAvatar(thread.senderId, thread.senderName)}
              <div className="thread-memory-post__meta-main">
                <strong>{thread.senderName}</strong>
                <time dateTime={firstResponseTime}>
                  {formatDetailTime(firstResponseTime)}
                </time>
              </div>
            </div>
            <figure
              className={`thread-memory-post__content-card frame-detail-content-card frame-detail-content-card--${photoOrientation}`}
            >
              <figure
                className={`thread-photo-message thread-photo-message--post thread-photo-message--${photoOrientation}`}
                aria-label={thread.photoAlt}
              >
                <img
                  className="thread-photo-message__backdrop"
                  src={thread.photoUrl}
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="thread-photo-message__image"
                  src={thread.photoUrl}
                  alt={thread.photoAlt}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    const ratio = image.naturalWidth / image.naturalHeight;
                    setPhotoOrientation(
                      ratio > 1.12
                        ? "landscape"
                        : ratio < 0.88
                          ? "portrait"
                          : "square",
                    );
                  }}
                />
              </figure>
              <figcaption className="thread-memory-post__content-body">
                {thread.initialMethod === "voice" ? (
                  <button
                    className={
                      playingVoice?.id === `initial-${thread.id}`
                        ? "thread-voice-message thread-voice-message--playing thread-memory-post__voice"
                        : "thread-voice-message thread-memory-post__voice"
                    }
                    type="button"
                    aria-label={
                      playingVoice?.id === `initial-${thread.id}`
                        ? `停止发起语音 ${playingVoice.remainingSeconds} 秒`
                        : `播放发起语音 ${initialVoiceDurationSeconds || ""} 秒`
                    }
                    aria-pressed={playingVoice?.id === `initial-${thread.id}`}
                    onClick={() =>
                      toggleVoicePlayback(
                        `initial-${thread.id}`,
                        initialVoiceDurationSeconds,
                      )
                    }
                  >
                    <span
                      className="thread-voice-message__icon"
                      aria-hidden="true"
                    >
                      {renderVoiceIcon(
                        playingVoice?.id === `initial-${thread.id}`,
                      )}
                    </span>
                    <span className="thread-voice-message__time">
                      {renderVoiceLabel(
                        `initial-${thread.id}`,
                        initialVoiceDurationSeconds,
                      )}
                    </span>
                  </button>
                ) : (
                  <p>{thread.initialContent}</p>
                )}
              </figcaption>
            </figure>
          </article>

          <div className="thread-comment-list" aria-label="最新互动">
            {replyTimeline.map((response) => {
              const isVoice = response.method === "voice";
              const author = members.find(
                (member) => member.id === response.authorId,
              );
              return (
                <article className="thread-comment" key={response.id}>
                  <span className="thread-comment__avatar-wrap">
                    {renderAvatar(response.authorId, response.authorName)}
                    {response.unread ? <i aria-label="未读回复" /> : null}
                  </span>
                  <div className="thread-comment__body">
                    <div className="thread-comment__meta">
                      <strong>{author?.name || response.authorName}</strong>
                      <span className="thread-comment__time">
                        <time dateTime={response.createdAt}>
                          {formatDetailTime(response.createdAt)}
                        </time>
                      </span>
                    </div>
                    {isVoice ? (
                      <button
                        className={
                          playingVoice?.id === response.id
                            ? "thread-voice-message thread-voice-message--playing"
                            : "thread-voice-message"
                        }
                        type="button"
                        aria-label={
                          playingVoice?.id === response.id
                            ? `停止语音回应 ${playingVoice.remainingSeconds} 秒`
                            : `播放语音回应 ${response.durationSeconds} 秒`
                        }
                        aria-pressed={playingVoice?.id === response.id}
                        onClick={() =>
                          toggleVoicePlayback(
                            response.id,
                            response.durationSeconds,
                          )
                        }
                      >
                        <span
                          className="thread-voice-message__icon"
                          aria-hidden="true"
                        >
                          {renderVoiceIcon(playingVoice?.id === response.id)}
                        </span>
                        <span className="thread-voice-message__time">
                          {renderVoiceLabel(
                            response.id,
                            response.durationSeconds,
                          )}
                        </span>
                      </button>
                    ) : (
                      <p>{response.content}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <FrameElderReplyPanel
          className="frame-detail-reply-panel"
          ref={replyPanelRef}
          scene="family"
          onScroll={syncTopbarPinned}
          onTouchMove={syncTopbarPinnedAfterRightScroll}
          onWheel={syncTopbarPinnedAfterRightScroll}
        />
      </section>
    </FramePageShell>
  );
}
