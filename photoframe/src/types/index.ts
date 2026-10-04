export type StoryTab = 'status' | 'treasure' | 'gallery' | 'memory' | 'profile'

export type ResponseMethod = 'voice' | 'text' | 'ai_generated' | 'emoji' | 'sticker'

export type MemoryTopicStatus = 'recommended' | 'unfinished' | 'completed' | 'locked'

export interface FamilyMember {
  id: string
  name: string
  relation: string
  avatar: string
  role: 'elder' | 'child'
  city?: string
  statusLabel?: string
  weatherLabel?: string
  conversationSummary?: string
  interactionSuggestions?: string[]
}

export interface FamilySpace {
  id: string
  name: string
  bindingCode: string
  elderName: string
}

export interface ElderProfile {
  id: string
  name: string
  gender: 'female' | 'male' | 'unspecified'
  birthYear: number
  relation: string
  voiceIntroText: string
  interests: string[]
  avoidTopics: string[]
}

export interface GalleryPhoto {
  id: string
  url: string
  alt: string
  title: string
  uploadedAt: string
  uploadedById: string
  uploadedByName: string
  isCached: boolean
  voiceNoteDurationSeconds?: number
  voiceNoteText?: string
  aiTitle?: string
  aiCategories?: string[]
  aiStoryHint?: string
  metadataSummary?: string
}

export interface InteractionResponse {
  id: string
  authorId: string
  authorName: string
  relation: string
  method: ResponseMethod
  content: string
  createdAt: string
  durationSeconds?: number
  stickerIds?: string[]
  unread?: boolean
}

export interface InteractionThread {
  id: string
  title: string
  photoUrl: string
  photoAlt: string
  photoLabel: string
  photoMeta: string
  photoTone: 'moss' | 'peach' | 'gold' | 'paper'
  senderId: string
  senderName: string
  initialContent: string
  initialMethod: ResponseMethod
  latestSnippet: string
  latestAt: string
  unread: boolean
  responses: InteractionResponse[]
}

export interface UploadPhotoDraft {
  id: string
  fileName: string
  previewUrl: string
  status: 'waiting' | 'uploading' | 'success' | 'failed'
  progress: number
}

export interface ComposeDraft {
  id: string
  photoUrl: string
  photoAlt: string
  source: 'camera' | 'album'
  mode: 'voice' | 'text'
  text: string
  selectedSuggestionId?: string
  voiceDurationSeconds?: number
  voiceUrl?: string
  status: 'editing' | 'sending' | 'success' | 'failed'
}

export interface MemoryTopic {
  id: string
  title: string
  summary: string
  status: MemoryTopicStatus
  updatedAt: string
  photoLabel?: string
  photoUrl?: string
}

export interface MemoryTheme {
  id: string
  title: string
  subtitle?: string
  completedCount: number
  totalCount: number
  rewardTitle: string
  rewardStatus: 'locked' | 'unlocked'
  topics: MemoryTopic[]
}

export interface MemoryStory {
  id: string
  type: 'topic' | 'chapter'
  title: string
  themeTitle: string
  generatedAt: string
  readDurationSeconds: number
  isNew: boolean
  body: string[]
  photoUrl?: string
  photoCaption?: string
}

export interface AiSuggestion {
  id: string
  text: string
  tone: 'warm' | 'curious' | 'light'
}

export type FrameDisplayMode = 'standard' | 'elder'

export interface FrameDeviceStatus {
  id: string
  deviceName: string
  displayMode: FrameDisplayMode
  networkStatus: 'online' | 'unstable' | 'offline'
  cacheStatus: 'ready' | 'syncing' | 'limited'
  microphoneStatus: 'granted' | 'missing'
  slideshowIntervalSeconds: number
  lastSyncedAt: string
  weatherLabel: string
  temperatureCelsius: number
}

export interface FrameQuickReply {
  id: string
  text: string
  replyType: 'emoji' | 'voice' | 'ai'
}

export interface FrameConversationLine {
  id: string
  speaker: 'elder' | 'ai'
  text: string
  createdAt: string
}

export type FrameStickerScene = 'common' | 'family' | 'square'

export interface FrameSticker {
  id: string
  label: string
  src: string
  category: string
  audience: 'common' | 'child' | 'parent' | 'square'
  scene: FrameStickerScene
}

export interface FamilyDynamic {
  id: string
  authorId: string
  authorName: string
  relation: string
  title: string
  summary: string
  body: string
  photoUrl: string
  photoAlt: string
  photoUrls?: string[]
  timeLabel: string
  placeLabel: string
  voiceDurationSeconds?: number
  replyCount: number
  stickerLabels: string[]
  insightTags: string[]
  threadId?: string
}

export interface FamilyWeeklyRecap {
  id: string
  title: string
  subtitle: string
  coverUrl: string
  scenes: {
    id: string
    title: string
    summary: string
    photoUrl: string
  }[]
}

export interface StudyModule {
  id: string
  title: string
  description: string
  intro?: string
  itemCount: number
  coverUrl: string
  items: StudyItem[]
}

export interface StudyItem {
  id: string
  title: string
  summary: string
  note?: string
  meta?: string
  photoUrl?: string
  durationSeconds?: number
  sealed?: boolean
  unlockLabel?: string
  sealedHint?: string
  type: 'photo' | 'draft' | 'voice' | 'article' | 'private' | 'wish'
  updatedAt: string
}

export type FragmentContentKind = 'photo' | 'voice' | 'file' | 'work'

export interface FragmentContentItem {
  id: string
  sourceId: string
  kind: FragmentContentKind
  title: string
  summary: string
  updatedAt: string
  photoUrl?: string
  durationSeconds?: number
  fileFormat?: string
  tags: string[]
}

export type ExploreFeatureSection = 'life' | 'health' | 'optional'

export interface ExploreFeatureItem {
  id: string
  section: ExploreFeatureSection
  title: string
  description: string
  icon: string
  action: string
  badge?: string
}

export type ExplorationOwnerType = 'family' | 'elder' | 'member'

export type ExplorationStatus = 'wish' | 'responded' | 'scheduled' | 'completed'

export type ExplorationVisibility = 'private' | 'family'

export interface FamilyExplorationItem {
  id: string
  ownerId: string
  ownerName: string
  ownerType: ExplorationOwnerType
  title: string
  summary: string
  reason: string
  category: string
  status: ExplorationStatus
  statusLabel: string
  visibility?: ExplorationVisibility
  participantNames: string[]
  nextStep: string
  dateLabel: string
  photoUrl: string
}

export interface RiverStage {
  id: string
  title: string
  years: string
  summary: string
  coverUrl: string
  stories: RiverStory[]
}

export interface RiverStory {
  id: string
  title: string
  summary: string
  body: string[]
  photoUrl: string
}

export interface SquarePost {
  id: string
  authorName: string
  authorTitle?: string
  title: string
  summary: string
  photoUrl: string
  tag: string
  topic?: string
  likes?: number
  comments?: number
  tags?: string[]
}

export interface SquareEvent {
  id: string
  title: string
  dateLabel: string
  location: string
  summary: string
  photoUrl: string
  category?: string
  organizer?: string
  capacityLabel?: string
  description?: string
}
