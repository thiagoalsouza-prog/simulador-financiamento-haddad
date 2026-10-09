/**
 * Único ponto de acesso ao localStorage do sistema. Nenhum dado de
 * paciente (nome, CPF, simulações, propostas) passa por aqui — apenas
 * tratamentos cadastrados, parâmetros de risco e preferências de tela
 * (tema, menu recolhido, ordenação da lista), conforme a política de
 * privacidade do produto.
 */
const ALLOWED_KEYS = [
  'haddad:treatments',
  'haddad:riskSettings',
  // preferências de tela (mesmas chaves dos outros sistemas Haddad)
  'tema',
  'menu-recolhido',
  'haddad:pacientes-visao',
  // chave antiga do tema: só leitura, para não perder a escolha de quem já usava o simulador
  'haddad:theme',
] as const

export type AllowedStorageKey = (typeof ALLOWED_KEYS)[number]

export function safeGetItem(key: AllowedStorageKey): string | null {
  if (!ALLOWED_KEYS.includes(key)) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSetItem(key: AllowedStorageKey, value: string): void {
  if (!ALLOWED_KEYS.includes(key)) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Armazenamento indisponível (modo privado, cota excedida etc.) — falha silenciosa.
  }
}
