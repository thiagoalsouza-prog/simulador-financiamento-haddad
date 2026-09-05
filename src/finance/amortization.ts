import type { AmortizationRow, CostRecoveryResult } from './types'

/**
 * Gera a tabela de amortização pelo Sistema Price.
 * A última parcela é ajustada para saldo anterior + juros do período,
 * eliminando resíduo de saldo causado por precisão numérica.
 */
export function buildAmortizationSchedule(
  principal: number,
  monthlyRate: number,
  months: number,
  payment: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = []
  let balance = principal

  for (let k = 1; k <= months; k++) {
    const interest = balance * monthlyRate
    const isLast = k === months

    if (isLast) {
      const finalPayment = balance + interest
      rows.push({
        number: k,
        payment: finalPayment,
        interest,
        amortization: balance,
        balance: 0,
      })
      balance = 0
    } else {
      const amortization = Math.max(0, payment - interest)
      balance = Math.max(0, balance - amortization)
      rows.push({
        number: k,
        payment,
        interest,
        amortization,
        balance,
      })
    }
  }

  return rows
}

/**
 * Encontra a parcela em que o caixa nominal recebido (entrada + prestações
 * pagas) alcança o custo direto do tratamento. Considera dinheiro
 * efetivamente recebido, não apenas amortização do saldo devedor.
 */
export function findNominalCostRecovery(
  directCost: number,
  downPayment: number,
  schedule: AmortizationRow[],
): CostRecoveryResult {
  if (downPayment >= directCost) {
    return {
      covered: true,
      installment: 0,
      receivedAtRecovery: downPayment,
    }
  }

  let accumulated = downPayment

  for (const row of schedule) {
    accumulated += row.payment

    if (accumulated >= directCost) {
      return {
        covered: true,
        installment: row.number,
        receivedAtRecovery: accumulated,
      }
    }
  }

  return {
    covered: false,
    installment: null,
    receivedAtRecovery: accumulated,
  }
}
