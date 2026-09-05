import type { Treatment } from '../finance/types'
import { safeGetItem, safeSetItem } from './safeStorage'

const KEY = 'haddad:treatments' as const

export const DEFAULT_TREATMENTS: Treatment[] = [
  { id: 'implant', name: 'Implante unitário', price: 4800, cost: 1900 },
  { id: 'protocol', name: 'Protocolo sobre implantes', price: 14800, cost: 6000 },
  { id: 'veneers', name: 'Lentes de contato dental', price: 18000, cost: 5200 },
]

function isTreatment(value: unknown): value is Treatment {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.price === 'number' &&
    typeof t.cost === 'number'
  )
}

export function loadTreatments(): Treatment[] {
  const raw = safeGetItem(KEY)
  if (!raw) return DEFAULT_TREATMENTS

  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(isTreatment)) {
      return parsed
    }
    return DEFAULT_TREATMENTS
  } catch {
    return DEFAULT_TREATMENTS
  }
}

export function saveTreatments(treatments: Treatment[]): void {
  safeSetItem(KEY, JSON.stringify(treatments))
}
