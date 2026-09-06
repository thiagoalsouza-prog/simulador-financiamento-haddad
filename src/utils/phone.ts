/** Mantém apenas dígitos e limita a 11 caracteres (DDD + celular/fixo). */
export function sanitizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11)
}

/** Aplica máscara (00) 00000-0000 ou (00) 0000-0000 a uma sequência de dígitos. */
export function maskPhone(digits: string): string {
  const d = sanitizePhoneInput(digits)
  if (d.length === 0) return ''

  const ddd = d.slice(0, 2)
  const rest = d.slice(2)

  if (d.length <= 2) return `(${ddd}`

  const isMobile = rest.length > 8
  const firstPart = isMobile ? rest.slice(0, 5) : rest.slice(0, 4)
  const secondPart = isMobile ? rest.slice(5, 9) : rest.slice(4, 8)

  return secondPart ? `(${ddd}) ${firstPart}-${secondPart}` : `(${ddd}) ${firstPart}`
}

/** Um telefone válido para busca/gravação tem DDD + 8 ou 9 dígitos (10 ou 11 no total). */
export function isValidPhone(digits: string): boolean {
  const d = sanitizePhoneInput(digits)
  return d.length === 10 || d.length === 11
}
