import type { TermByInstallmentResult } from './types'

const MAX_MONTHS = 120

/**
 * Determina o menor número inteiro de parcelas (Sistema Price) necessário
 * para quitar `principal` sem que a prestação máxima informada ultrapasse
 * o limite do paciente, respeitando o teto de 120 parcelas.
 */
export function calculateTermByInstallment(
  principal: number,
  monthlyRate: number,
  maxInstallment: number,
  maxMonths: number = MAX_MONTHS,
): TermByInstallmentResult {
  const firstPeriodInterest = principal * monthlyRate

  if (!Number.isFinite(maxInstallment) || maxInstallment <= 0) {
    return { feasible: false, months: null, firstPeriodInterest, reason: 'invalidInput' }
  }

  if (principal <= 0) {
    return { feasible: true, months: 1, firstPeriodInterest: 0 }
  }

  if (monthlyRate === 0) {
    const months = Math.ceil(principal / maxInstallment)
    if (months > maxMonths) {
      return { feasible: false, months: null, firstPeriodInterest, reason: 'exceedsMaxTerm' }
    }
    return { feasible: true, months, firstPeriodInterest: 0 }
  }

  if (maxInstallment <= firstPeriodInterest) {
    return { feasible: false, months: null, firstPeriodInterest, reason: 'installmentTooLow' }
  }

  const ratio = 1 - (principal * monthlyRate) / maxInstallment
  const months = Math.ceil(-Math.log(ratio) / Math.log(1 + monthlyRate))

  if (!Number.isFinite(months) || months <= 0 || months > maxMonths) {
    return { feasible: false, months: null, firstPeriodInterest, reason: 'exceedsMaxTerm' }
  }

  return { feasible: true, months, firstPeriodInterest }
}
