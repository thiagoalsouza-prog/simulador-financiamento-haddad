import type { RiskSettings } from '../finance/types'
import { safeGetItem, safeSetItem } from './safeStorage'

const KEY = 'haddad:riskSettings' as const

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  attentionTermMonths: 24,
  minMarginPct: 30,
  minDownPaymentPct: 10,
  maxMonthlyRatePct: 5,
}

function isRiskSettings(value: unknown): value is RiskSettings {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return (
    typeof s.attentionTermMonths === 'number' &&
    typeof s.minMarginPct === 'number' &&
    typeof s.minDownPaymentPct === 'number' &&
    typeof s.maxMonthlyRatePct === 'number'
  )
}

export function loadRiskSettings(): RiskSettings {
  const raw = safeGetItem(KEY)
  if (!raw) return DEFAULT_RISK_SETTINGS

  try {
    const parsed: unknown = JSON.parse(raw)
    if (isRiskSettings(parsed)) return parsed
    return DEFAULT_RISK_SETTINGS
  } catch {
    return DEFAULT_RISK_SETTINGS
  }
}

export function saveRiskSettings(settings: RiskSettings): void {
  safeSetItem(KEY, JSON.stringify(settings))
}
