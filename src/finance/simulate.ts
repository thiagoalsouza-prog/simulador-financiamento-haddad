import { buildAmortizationSchedule, findNominalCostRecovery } from './amortization'
import { calculateTermByInstallment } from './breakEven'
import { calculatePricePayment } from './price'
import { evaluateRisk } from './risk'
import type { RiskSettings, SimulationOutcome, SimulationParams } from './types'

const MAX_MONTHS = 120

function emptySchedule(): SimulationOutcome {
  return {
    feasible: false,
    principal: 0,
    monthlyRate: 0,
    installmentsCount: 0,
    installmentValue: 0,
    schedule: [],
    totalInstallments: 0,
    totalReceived: 0,
    creditCost: 0,
    costRecovery: { covered: false, installment: null, receivedAtRecovery: 0 },
    principalRecovery: { covered: false, installment: null, receivedAtRecovery: 0 },
    amountMissingAfterDownPayment: 0,
    managerialResult: 0,
    marginPct: 0,
    downPaymentPct: 0,
    risk: { alerts: [], level: 'healthy' },
  }
}

/**
 * Orquestra o cálculo completo de uma simulação: prestação Price, prazo
 * (quando informado por parcela máxima), tabela de amortização, recuperação
 * nominal do custo, resultado gerencial e classificação de risco.
 */
export function runSimulation(params: SimulationParams, riskSettings: RiskSettings): SimulationOutcome {
  const { treatmentValue, directCost, downPayment, monthlyRatePct, mode } = params
  const monthlyRate = monthlyRatePct / 100
  const principal = Math.max(0, treatmentValue - downPayment)

  let installmentsCount: number
  let infeasibleMessage: string | undefined

  if (mode === 'byTerm') {
    installmentsCount = params.installments ?? 0
    if (!Number.isInteger(installmentsCount) || installmentsCount < 1 || installmentsCount > MAX_MONTHS) {
      return { ...emptySchedule(), infeasibleMessage: 'Informe um número de parcelas entre 1 e 120.' }
    }
  } else {
    const maxInstallment = params.maxInstallment ?? 0
    const term = calculateTermByInstallment(principal, monthlyRate, maxInstallment, MAX_MONTHS)

    if (!term.feasible || term.months === null) {
      if (term.reason === 'installmentTooLow') {
        infeasibleMessage = `Condição inviável: a parcela precisa ser maior que os juros do primeiro período, que correspondem a R$ ${term.firstPeriodInterest.toFixed(2).replace('.', ',')}.`
      } else if (term.reason === 'exceedsMaxTerm') {
        infeasibleMessage = 'A parcela informada não quita o saldo em até 120 meses.'
      } else {
        infeasibleMessage = 'Informe uma parcela máxima válida, maior que zero.'
      }
      return { ...emptySchedule(), infeasibleMessage }
    }

    installmentsCount = term.months
  }

  const installmentValue = principal === 0 ? 0 : calculatePricePayment(principal, monthlyRate, installmentsCount)
  const schedule = buildAmortizationSchedule(principal, monthlyRate, installmentsCount, installmentValue)

  const totalInstallments = schedule.reduce((sum, row) => sum + row.payment, 0)
  const totalReceived = downPayment + totalInstallments
  const creditCost = totalInstallments - principal
  const costRecovery = findNominalCostRecovery(directCost, downPayment, schedule)
  const principalRecovery = findNominalCostRecovery(principal, downPayment, schedule)
  const amountMissingAfterDownPayment = Math.max(0, directCost - downPayment)
  const managerialResult = totalReceived - directCost
  const marginPct = totalReceived === 0 ? 0 : (managerialResult / totalReceived) * 100
  const downPaymentPct = treatmentValue === 0 ? 0 : (downPayment / treatmentValue) * 100

  const risk = evaluateRisk(
    { months: installmentsCount, marginPct, downPaymentPct, monthlyRatePct },
    riskSettings,
  )

  return {
    feasible: true,
    principal,
    monthlyRate,
    installmentsCount,
    installmentValue,
    schedule,
    totalInstallments,
    totalReceived,
    creditCost,
    costRecovery,
    principalRecovery,
    amountMissingAfterDownPayment,
    managerialResult,
    marginPct,
    downPaymentPct,
    risk,
  }
}
