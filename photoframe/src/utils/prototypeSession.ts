const FAMILY_SPACE_NAME_STORAGE_KEY = 'silver-frame.prototype.familySpaceName'

export function getPrototypeFamilySpaceName(defaultName: string) {
  if (typeof window === 'undefined') return defaultName

  return window.sessionStorage.getItem(FAMILY_SPACE_NAME_STORAGE_KEY) || defaultName
}

export function setPrototypeFamilySpaceName(name: string) {
  if (typeof window === 'undefined') return

  // Prototype-only session cache: replace with backend persistence when real family settings API lands.
  window.sessionStorage.setItem(FAMILY_SPACE_NAME_STORAGE_KEY, name)
}
