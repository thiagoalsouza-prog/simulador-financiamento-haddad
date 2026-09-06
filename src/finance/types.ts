export type SimulationMode = 'byTerm' | 'byInstallment'

export interface Treatment {
  id: string
  name: string
  price: number
  cost: number
}

export interface RiskSettings {
  attentionTermMonths: number
  minMarginPct: number
  minDownPaymentPct: number
  maxMonthlyRatePct: number
}

export interface AmortizationRow {
  number: number
  payment: number
  interest: number
  amortization: number
  balance: number
}

export interface CostRecoveryResult {
  covered: boolean
  installment: number | null
  receivedAtRecovery: number
}

export type InfeasibleReason = 'installmentTooLow' | 'exceedsMaxTerm' | 'invalidInput'

export interface TermByInstallmentResult {
  feasible: boolean
  months: number | null
  firstPeriodInterest: number
  reason?: InfeasibleReason
}

export interface SimulationParams {
  treatmentValue: number
  directCost: number
  downPayment: number
  monthlyRatePct: number
  mode: SimulationMode
  installments?: number
  maxInstallment?: number
}

export type RiskLevel = 'healthy' | 'moderate' | 'high'

export interface RiskEvaluation {
  alerts: string[]
  level: RiskLevel
}

export interface SimulationOutcome {
  feasible: boolean
  infeasibleMessage?: string
  principal: number
  monthlyRate: number
  installmentsCount: number
  installmentValue: number
  schedule: AmortizationRow[]
  totalInstallments: number
  totalReceived: number
  creditCost: number
  costRecovery: CostRecoveryResult
  principalRecovery: CostRecoveryResult
  amountMissingAfterDownPayment: number
  managerialResult: number
  marginPct: number
  downPaymentPct: number
  risk: RiskEvaluation
}

export interface Scenario {
  id: string
  label: string
  params: SimulationParams
  outcome: SimulationOutcome
}
