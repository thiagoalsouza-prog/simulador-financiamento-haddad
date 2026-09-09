import type { RiskSettings } from '../finance/types'
import { safeGetItem, safeSetItem } from './safeStorage'

const KEY = 'haddad:riskSettings' as const

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  attentionTermMonths: 24,
  minMarginPct: 30,
  minDownPaymentPct: 10,
  maxMonthlyRatePct: 5,
  defaultInstallments: 18,
  defaultMonthlyRatePct: 3.5,
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function loadRiskSettings(): RiskSettings {
  const raw = safeGetItem(KEY)
  if (!raw) return DEFAULT_RISK_SETTINGS

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return DEFAULT_RISK_SETTINGS
    const p = parsed as Record<string, unknown>
    return {
      attentionTermMonths: numberOrDefault(p.attentionTermMonths, DEFAULT_RISK_SETTINGS.attentionTermMonths),
      minMarginPct: numberOrDefault(p.minMarginPct, DEFAULT_RISK_SETTINGS.minMarginPct),
      minDownPaymentPct: numberOrDefault(p.minDownPaymentPct, DEFAULT_RISK_SETTINGS.minDownPaymentPct),
      maxMonthlyRatePct: numberOrDefault(p.maxMonthlyRatePct, DEFAULT_RISK_SETTINGS.maxMonthlyRatePct),
      defaultInstallments: numberOrDefault(p.defaultInstallments, DEFAULT_RISK_SETTINGS.defaultInstallments),
      defaultMonthlyRatePct: numberOrDefault(p.defaultMonthlyRatePct, DEFAULT_RISK_SETTINGS.defaultMonthlyRatePct),
    }
  } catch {
    return DEFAULT_RISK_SETTINGS
  }
}

export function saveRiskSettings(settings: RiskSettings): void {
  safeSetItem(KEY, JSON.stringify(settings))
}
