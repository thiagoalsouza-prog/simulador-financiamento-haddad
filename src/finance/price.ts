/**
 * Sistema Price (tabela price / juros compostos).
 * P = principal financiado, i = taxa mensal decimal, n = número de parcelas.
 */
export function calculatePricePayment(
  principal: number,
  monthlyRate: number,
  months: number,
): number {
  if (!Number.isFinite(principal) || principal < 0) {
    throw new Error('Principal inválido.')
  }
  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) {
    throw new Error('Taxa de juros inválida.')
  }
  if (!Number.isInteger(months) || months <= 0) {
    throw new Error('Número de parcelas inválido.')
  }

  if (principal === 0) return 0

  if (monthlyRate === 0) {
    return principal / months
  }

  const factor = Math.pow(1 + monthlyRate, months)
  return (principal * (monthlyRate * factor)) / (factor - 1)
}
