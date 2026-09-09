import { safeGetItem, safeSetItem } from './safeStorage'

const KEY = 'haddad:theme' as const

export type Theme = 'light' | 'dark'

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

export function loadTheme(): Theme {
  const stored = safeGetItem(KEY)
  if (isTheme(stored)) return stored
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function saveTheme(theme: Theme): void {
  safeSetItem(KEY, theme)
}
