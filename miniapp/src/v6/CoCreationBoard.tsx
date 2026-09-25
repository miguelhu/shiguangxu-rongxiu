import { ArrowRight, Check, Eye, LockSimple, UsersThree } from '@phosphor-icons/react'
import { useDemo } from './context'
import { Page, relationLabel } from './data'
import { available } from './model'
import { Button, Note } from './ui'

const directions = {
  teacher: [
    ['课堂里的小事', 4],
    ['职业高光时刻', 5],
    ['师徒传承', 0],
    ['生活里的陈老师', 2],
  ],
  leader: [
    ['一起解决的难题', 5],
    ['带年轻人的时刻', 1],
    ['交棒与传承', 0],
    ['工作之外的一面', 2],
  ],
  nurse: [
    ['照顾人的细节', 5],
    ['团队并肩时刻', 3],
    ['经验传承', 1],
    ['工作之外的一面', 0],
  ],
  birthday: [
    ['一起长大的片段', 4],
    ['家里的日常', 3],
    ['朋友眼中的他', 1],
    ['未来的新愿望', 0],
  ],
  anniversary: [
    ['初识与相伴', 3],
    ['家庭里的日常', 4],
    ['一起走过的变化', 2],
    ['朋友眼中的两个人', 0],
  ],
} as const

export function CoCreationBoard({ go }: { go: (page: Page) => void }) {
  const { c, s, role, patch } = useDemo()
  const blocks = available(c.id, s).filter((block) => !['onsite', 'greeting'].includes(block.source))
  const authors = [...new Map(blocks.map((block) => [block.authorId, block])).values()]
  const relations = [...new Set(authors.map((block) => block.relation).filter(Boolean))]
  const boardMode = s.host.boardMode || 'surprise'
  const themes = directions[c.id]
  const max = Math.max(...themes.map(([, count]) => count), 1)
  const snippets = blocks
    .filter((block) => block.kind === 'story' && block.body && block.peerPreviewAllowed === true)
    .slice(0, 3)

  return (
    <div className="phone-body cocreation-board">
      <div className="eyebrow">礼物还在准备 · 共创看板</div>
      <h2>
        看见彼此参与，
        <br />
        也看见还缺哪一块。
      </h2>
      <p className="prose">这里不做评论和聊天，只呈现共同准备的进度与内容方向。</p>

      {role === 'coordinator' && (
        <section className="board-mode-panel">
          <small>共创看板展示方式</small>
          <div className="segmented">
            <button
              className={boardMode === 'surprise' ? 'active' : ''}
              onClick={() => patch((old) => ({ host: { ...old.host, boardMode: 'surprise' } }))}
            >
              惊喜准备
            </button>
            <button
              className={boardMode === 'open' ? 'active' : ''}
              onClick={() => patch((old) => ({ host: { ...old.host, boardMode: 'open' } }))}
            >
              一起准备
            </button>
          </div>
          <p>
            {boardMode === 'surprise'
              ? '只让参与者看到人数、关系与方向缺口，具体投稿保持保密。'
              : '除进度外，可展示作者明确授权公开给本项目共创者的片段摘要。'}
          </p>
        </section>
      )}

      <section className="board-overview">
        <div>
          <UsersThree size={21} />
          <strong>{Math.max(authors.length, c.id === 'teacher' ? 12 : authors.length)} 位</strong>
          <small>已经留下心意</small>
        </div>
        <div>
          <Eye size={21} />
          <strong>{relations.length || 3} 类</strong>
          <small>不同关系视角</small>
        </div>
      </section>

      <div className="board-people board-people-anonymous" aria-label="匿名参与进度">
        <div className="anonymous-participants" aria-hidden="true">
          {Array.from({ length: Math.min(6, Math.max(authors.length, 6)) }).map((_, index) => (
            <i key={index} />
          ))}
        </div>
        <span>已有 {Math.max(authors.length, c.id === 'teacher' ? 12 : authors.length)} 人参与，身份保持匿名</span>
      </div>

      <p className="board-summary">
        大家从 {relations.length || 3} 类关系留下了心意；“{themes.find(([, count]) => count === 0)?.[0] || '另一段记忆'}”方向仍待补充。
      </p>

      <section className="board-relations">
        <h3>大家从哪些关系出发</h3>
        <div className="chips">
          {(relations.length ? relations : ['学生', '同事', '朋友']).slice(0, 5).map((relation) => (
            <span key={relation}>{relation}</span>
          ))}
        </div>
        <small>只显示汇总分类，不公开任何人的联系方式与具体关系备注。</small>
      </section>

      <section className="board-directions">
        <header>
          <h3>这份礼物正在长出什么</h3>
          <small>内容方向 · 演示统计</small>
        </header>
        {themes.map(([label, count]) => (
          <div className={count === 0 ? 'direction-row empty' : 'direction-row'} key={label}>
            <div>
              <span>{label}</span>
              <b>{count ? `${count} 段` : '还是空白'}</b>
            </div>
            <i><em style={{ width: `${count ? Math.max(18, (count / max) * 100) : 0}%` }} /></i>
          </div>
        ))}
      </section>

      {boardMode === 'surprise' ? (
        <Note>
          <LockSimple size={17} /> 惊喜准备中：看得到大家在参与，看不到任何人的具体投稿。
        </Note>
      ) : (
        <section className="authorized-snippets">
          <header>
            <h3>获授权的片段</h3>
            <small>仅展示作者允许共创者互相看到的摘要</small>
          </header>
          {(snippets.length ? snippets : [
            { id: 'sample-1', author: '一位学生', relation: '学生', body: '您没有急着给答案，而是陪我把问题慢慢理清。' },
            { id: 'sample-2', author: '一位同事', relation: '同事', body: '评审结束后，您仍留下来听年轻人把想法讲完。' },
          ]).map((block) => (
            <article key={block.id}>
              <p>“{block.body.length > 54 ? `${block.body.slice(0, 54)}…` : block.body}”</p>
              <small>{block.author} · {block.relation || relationLabel('other')} · 已授权展示摘要</small>
            </article>
          ))}
          <p className="tiny">片段只用于彼此启发，不开放评论、点赞或回复。</p>
        </section>
      )}

      <section className="board-gap-card">
        <Check size={22} />
        <div>
          <b>可以补上「{themes.find(([, count]) => count === 0)?.[0] || '另一段记忆'}」</b>
          <p>如果你刚好记得，不妨从这个方向留下一件小事；也可以继续写自己最想说的。</p>
        </div>
      </section>
      {role === 'coordinator' && (
        <section className="board-projection-card">
          <div>
            <small>礼中投屏 · 可选</small>
            <b>只读呈现共同准备的进度</b>
            <p>现场可展示匿名人数、关系覆盖和方向变化；不开放评论、抢答或实时对话。</p>
          </div>
          <span>只读</span>
        </section>
      )}
      {role === 'contributor' ? (
        <Button onClick={() => go('impressions')}>补上一份不同的记忆 <ArrowRight /></Button>
      ) : (
        <Button onClick={() => go('invite_manage')}>带着缺口继续邀请 <ArrowRight /></Button>
      )}
      <button className="text-button" onClick={() => go(role === 'coordinator' ? 'workspace' : 'progress')}>返回</button>
    </div>
  )
}
