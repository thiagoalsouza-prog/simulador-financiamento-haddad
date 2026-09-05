const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  return currencyFormatter.format(safe)
}

/**
 * Converte texto digitado pelo usuário em número. Aceita "14800",
 * "14.800", "14.800,00" e "14800,00". Nunca deve ser usado para cálculos
 * a partir de valores já formatados — apenas para ler entrada do usuário.
 */
export function parseCurrencyInput(raw: string): number {
  if (!raw) return 0

  let s = raw.replace(/[^\d.,-]/g, '').trim()
  if (!s) return 0

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    s = s.replace(',', '.')
  } else if (hasDot) {
    const parts = s.split('.')
    const last = parts[parts.length - 1]
    if (parts.length > 1 && last.length === 3) {
      s = s.replace(/\./g, '')
    }
  }

  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/** Formata um número para edição em campo monetário, sem o símbolo "R$". */
export function formatNumberForEdit(value: number): string {
  if (!Number.isFinite(value)) return ''
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
