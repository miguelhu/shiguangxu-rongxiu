import type {
  AiSuggestion,
  ElderProfile,
  FamilyDynamic,
  FamilyExplorationItem,
  FamilyMember,
  FamilySpace,
  FamilyWeeklyRecap,
  FrameConversationLine,
  FrameDeviceStatus,
  FrameQuickReply,
  FrameSticker,
  GalleryPhoto,
  InteractionThread,
  MemoryStory,
  MemoryTheme,
  RiverStage,
  SquareEvent,
  SquarePost,
  StudyModule,
  UploadPhotoDraft,
} from '../types'

export type ScenarioId = 'default' | 'ama-letter' | 'teacher-retirement'

export type PrototypeScenario = {
  id: ScenarioId
  label: string
  familyAvatarSrc?: string
  memberAvatarSrc?: Record<string, string>
  memberAvatarNameMatch?: Record<string, string>
  familySpace?: FamilySpace
  elderProfile?: ElderProfile
  members?: FamilyMember[]
  galleryPhotos?: GalleryPhoto[]
  interactionThreads?: InteractionThread[]
  memoryThemes?: MemoryTheme[]
  memoryStories?: MemoryStory[]
  aiSuggestions?: AiSuggestion[]
  uploadDrafts?: UploadPhotoDraft[]
  frameDeviceStatus?: FrameDeviceStatus
  frameQuickReplies?: FrameQuickReply[]
  frameConversation?: FrameConversationLine[]
  frameStickers?: FrameSticker[]
  familyDynamics?: FamilyDynamic[]
  familyInsightSummary?: string
  familyWeeklyRecap?: FamilyWeeklyRecap
  studyModules?: StudyModule[]
  familyExplorationItems?: FamilyExplorationItem[]
  riverStages?: RiverStage[]
  squarePosts?: SquarePost[]
  squareEvents?: SquareEvent[]
}
