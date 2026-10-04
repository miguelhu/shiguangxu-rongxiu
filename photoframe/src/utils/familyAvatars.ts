import { getActiveScenario } from '../content/scenarioStore'

export const FAMILY_FILTER_ALL = 'all'

export const FAMILY_AVATAR_SRC = '/sheguang-avatars/family_photo.png'

const MEMBER_AVATAR_SRC: Record<string, string> = {
  'member-child-yu': '/sheguang-avatars/avatar_xiaomei.png',
  'member-child-chen': '/sheguang-avatars/avatar_jiahe_centered_v5.jpg',
  'member-elder-lin': '/sheguang-avatars/family_grandma.png',
}

export function getMemberAvatarSrc(memberId?: string) {
  if (!memberId) return undefined
  return getActiveScenario().memberAvatarSrc?.[memberId] || MEMBER_AVATAR_SRC[memberId]
}

export function getMemberAvatarSrcByName(name?: string) {
  if (!name) return undefined
  const scenarioNameMatch = getActiveScenario().memberAvatarNameMatch
  const scenarioMatch = scenarioNameMatch
    ? Object.entries(scenarioNameMatch).find(([keyword]) => name.includes(keyword))?.[1]
    : undefined
  if (scenarioMatch) return scenarioMatch
  if (name.includes('知夏')) return MEMBER_AVATAR_SRC['member-child-yu']
  if (name.includes('嘉禾')) return MEMBER_AVATAR_SRC['member-child-chen']
  if (name.includes('秀兰') || name.includes('外婆')) return MEMBER_AVATAR_SRC['member-elder-lin']
  return undefined
}

export function getFamilyAvatarSrc() {
  return getActiveScenario().familyAvatarSrc || FAMILY_AVATAR_SRC
}
