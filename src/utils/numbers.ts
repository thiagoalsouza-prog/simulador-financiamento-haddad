export function formatPercent(valuePct: number, fractionDigits = 1): string {
  const safe = Number.isFinite(valuePct) ? valuePct : 0
  return `${safe.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`
}

/** Converte texto digitado ("3,5" ou "3.5") em número percentual (3.5). */
export function parsePercentInput(raw: string): number {
  if (!raw) return 0
  const s = raw.replace(/[^\d.,-]/g, '').replace(',', '.').trim()
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export function formatInstallments(n: number): string {
  return `${n}×`
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
