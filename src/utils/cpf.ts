/** Mantém apenas dígitos e limita a 11 caracteres (CPF). Nunca persiste o valor. */
export function sanitizeCpfInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11)
}

/** Aplica a máscara 000.000.000-00 a uma sequência de dígitos de CPF. */
export function maskCpf(digits: string): string {
  const d = sanitizeCpfInput(digits)
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean)
  let result = parts.join('.')
  if (d.length > 9) {
    result += `-${d.slice(9, 11)}`
  }
  return result
}
