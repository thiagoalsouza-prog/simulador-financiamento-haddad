import type { RiskEvaluation, RiskSettings } from './types'

export interface RiskInput {
  months: number
  marginPct: number
  downPaymentPct: number
  monthlyRatePct: number
}

export function evaluateRisk(input: RiskInput, settings: RiskSettings): RiskEvaluation {
  const alerts: string[] = []

  if (input.months > settings.attentionTermMonths) {
    alerts.push(`Prazo de ${input.months} parcelas acima do limite de atenção (${settings.attentionTermMonths} meses).`)
  }
  if (input.marginPct < settings.minMarginPct) {
    alerts.push(`Margem abaixo do mínimo definido (${settings.minMarginPct}%).`)
  }
  if (input.downPaymentPct < settings.minDownPaymentPct) {
    alerts.push(`Entrada abaixo do mínimo definido (${settings.minDownPaymentPct}% do tratamento).`)
  }
  if (input.monthlyRatePct < settings.minMonthlyRatePct) {
    alerts.push(`Juros abaixo do mínimo definido (${settings.minMonthlyRatePct}% ao mês).`)
  }
  if (input.monthlyRatePct > settings.maxMonthlyRatePct) {
    alerts.push(`Juros acima do máximo definido (${settings.maxMonthlyRatePct}% ao mês).`)
  }

  let level: RiskEvaluation['level'] = 'healthy'
  if (alerts.length >= 3) level = 'high'
  else if (alerts.length >= 1) level = 'moderate'

  return { alerts, level }
}
