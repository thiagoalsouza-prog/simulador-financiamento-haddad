import { safeGetItem, safeSetItem } from './safeStorage'

/** Escuro é o padrão do design system Haddad; claro é opcional (<html data-tema="claro">). */
export type Theme = 'claro' | 'escuro'

export function loadTheme(): Theme {
  const stored = safeGetItem('tema')
  if (stored === 'claro' || stored === 'escuro') return stored
  // quem já escolhia o tema claro antes do design system novo continua no claro
  return safeGetItem('haddad:theme') === 'light' ? 'claro' : 'escuro'
}

export function saveTheme(theme: Theme): void {
  safeSetItem('tema', theme)
}

/** Cor da barra do navegador no celular (meta theme-color) de cada tema: mesmo fundo da tela. */
const BROWSER_BAR_COLOR: Record<Theme, string> = { escuro: '#080d19', claro: '#f4f6fb' }

export function applyTheme(theme: Theme): void {
  if (theme === 'claro') document.documentElement.dataset.tema = 'claro'
  else delete document.documentElement.dataset.tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_BAR_COLOR[theme])
}
