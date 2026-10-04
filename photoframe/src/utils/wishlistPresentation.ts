import { BookOpenText, Camera, FirstAidKit, Flower, ForkKnife, HouseLine, MapPin, Microphone, MusicNotes, WifiHigh } from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import type { FamilyExplorationItem } from '../types'

export type WishlistIconTone = 'apricot' | 'olive' | 'rose' | 'sky' | 'sage' | 'gold' | 'neutral'

export function getWishlistPresentation(item: FamilyExplorationItem): { Icon: PhosphorIcon; tone: WishlistIconTone } {
  const text = `${item.title} ${item.category} ${item.summary}`

  if (text.includes('海边') || text.includes('旅行') || text.includes('老房子')) {
    return { Icon: MapPin, tone: 'sky' }
  }

  if (text.includes('录') || text.includes('声音') || text.includes('唱歌') || text.includes('视频')) {
    return { Icon: Microphone, tone: 'rose' }
  }

  if (text.includes('照片') || text.includes('合影') || text.includes('全家福') || text.includes('拍')) {
    return { Icon: Camera, tone: 'apricot' }
  }

  if (text.includes('花') || text.includes('阳台')) {
    return { Icon: Flower, tone: 'olive' }
  }

  if (text.includes('饭') || text.includes('糖醋排骨') || text.includes('厨房')) {
    return { Icon: ForkKnife, tone: 'gold' }
  }

  if (text.includes('药') || text.includes('提醒')) {
    return { Icon: FirstAidKit, tone: 'sage' }
  }

  if (text.includes('相框') || text.includes('网络')) {
    return { Icon: WifiHigh, tone: 'sky' }
  }

  if (text.includes('歌')) {
    return { Icon: MusicNotes, tone: 'rose' }
  }

  if (text.includes('家') || text.includes('陪')) {
    return { Icon: HouseLine, tone: 'olive' }
  }

  return { Icon: BookOpenText, tone: 'neutral' }
}
