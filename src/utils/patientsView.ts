import type { PatientRecord } from '../api/patients'
import { safeGetItem, safeSetItem } from '../storage/safeStorage'

/** Regras da lista de pacientes salvos: filtros, ordenação, paginação e totais. Só funções puras, sem tela. */

export type SortKey = 'nome' | 'valor' | 'total' | 'atualizado'
export type SortDir = 'asc' | 'desc'
export type SituationFilter = 'todos' | 'com' | 'sem'
export type PeriodFilter = 'todos' | 'hoje' | '7d' | '30d'

export interface PatientsFilters {
  situacao: SituationFilter
  /** nome exato do tratamento da última simulação; vazio = todos */
  tratamento: string
  periodo: PeriodFilter
}

export const NO_SIMULATION_LABEL = 'Sem simulação'

export const NO_FILTERS: PatientsFilters = { situacao: 'todos', tratamento: '', periodo: 'todos' }

export function hasActiveFilters(filters: PatientsFilters): boolean {
  return filters.situacao !== 'todos' || filters.tratamento !== '' || filters.periodo !== 'todos'
}

const DAY_MS = 24 * 60 * 60 * 1000

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function filterPatients(list: PatientRecord[], filters: PatientsFilters, now: Date = new Date()): PatientRecord[] {
  return list.filter((patient) => {
    if (filters.situacao === 'com' && !patient.simulacao) return false
    if (filters.situacao === 'sem' && patient.simulacao) return false
    if (filters.tratamento && patient.simulacao?.tratamentoNome !== filters.tratamento) return false

    if (filters.periodo !== 'todos') {
      const updated = new Date(patient.atualizado_em)
      if (Number.isNaN(updated.getTime())) return false
      if (filters.periodo === 'hoje') return isSameLocalDay(updated, now)
      const limit = filters.periodo === '7d' ? 7 : 30
      return now.getTime() - updated.getTime() <= limit * DAY_MS
    }
    return true
  })
}

/** Valor numérico da coluna; `null` quando o paciente não tem simulação (vai sempre para o fim da lista). */
function sortValue(patient: PatientRecord, key: SortKey): string | number | null {
  switch (key) {
    case 'nome':
      return patient.nome
    case 'valor':
      return patient.simulacao ? patient.simulacao.valorTratamento : null
    case 'total':
      return patient.simulacao ? patient.simulacao.totalReceber : null
    case 'atualizado': {
      const time = Date.parse(patient.atualizado_em)
      return Number.isNaN(time) ? null : time
    }
  }
}

export function sortPatients(list: PatientRecord[], key: SortKey, dir: SortDir): PatientRecord[] {
  const factor = dir === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    const va = sortValue(a, key)
    const vb = sortValue(b, key)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    if (typeof va === 'string' && typeof vb === 'string') {
      return factor * va.localeCompare(vb, 'pt-BR', { sensitivity: 'base' })
    }
    return factor * ((va as number) - (vb as number))
  })
}

export function treatmentOptions(list: PatientRecord[]): string[] {
  const names = new Set<string>()
  for (const patient of list) {
    if (patient.simulacao?.tratamentoNome) names.add(patient.simulacao.tratamentoNome)
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
}

export interface PatientsSummary {
  total: number
  withSimulation: number
  /** soma do valor de tratamento das últimas simulações */
  simulatedValue: number
  /** soma do total a receber das últimas simulações */
  simulatedReceivable: number
}

export function summarizePatients(list: PatientRecord[]): PatientsSummary {
  let withSimulation = 0
  let simulatedValue = 0
  let simulatedReceivable = 0
  for (const patient of list) {
    if (!patient.simulacao) continue
    withSimulation += 1
    simulatedValue += patient.simulacao.valorTratamento
    simulatedReceivable += patient.simulacao.totalReceber
  }
  return { total: list.length, withSimulation, simulatedValue, simulatedReceivable }
}

export interface TreatmentShare {
  label: string
  count: number
  /** soma do valor de tratamento das últimas simulações do grupo */
  value: number
}

/** Pacientes agrupados pelo tratamento da última simulação (quem não tem simulação forma um grupo à parte). */
export function distributionByTreatment(list: PatientRecord[], limit = 5): TreatmentShare[] {
  const groups = new Map<string, TreatmentShare>()
  for (const patient of list) {
    const label = patient.simulacao?.tratamentoNome ?? NO_SIMULATION_LABEL
    const group = groups.get(label) ?? { label, count: 0, value: 0 }
    group.count += 1
    group.value += patient.simulacao?.valorTratamento ?? 0
    groups.set(label, group)
  }

  const sorted = [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
  if (sorted.length <= limit) return sorted

  const rest = sorted
    .slice(limit - 1)
    .reduce((acc, group) => ({ ...acc, count: acc.count + group.count, value: acc.value + group.value }), {
      label: 'Outros',
      count: 0,
      value: 0,
    })
  return [...sorted.slice(0, limit - 1), rest]
}

export interface Pagination<T> {
  rows: T[]
  page: number
  pages: number
  /** posição (1-based) do primeiro e do último item exibido; 0 quando a lista está vazia */
  from: number
  to: number
}

export function paginate<T>(list: T[], page: number, pageSize: number): Pagination<T> {
  const size = Math.max(1, Math.floor(pageSize))
  const pages = Math.max(1, Math.ceil(list.length / size))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages)
  const start = (current - 1) * size
  const rows = list.slice(start, start + size)
  return { rows, page: current, pages, from: rows.length ? start + 1 : 0, to: start + rows.length }
}

/* ---------- preferências de visualização (só ordenação e itens por página; nada de dados de paciente) ---------- */

export const PAGE_SIZES = [10, 20, 50] as const

export interface ViewPrefs {
  ordem: SortKey
  direcao: SortDir
  porPagina: number
}

export const DEFAULT_VIEW: ViewPrefs = { ordem: 'atualizado', direcao: 'desc', porPagina: 10 }

export function loadViewPrefs(): ViewPrefs {
  const raw = safeGetItem('haddad:pacientes-visao')
  if (!raw) return DEFAULT_VIEW
  try {
    const parsed = JSON.parse(raw) as Partial<ViewPrefs>
    const ordem = (['nome', 'valor', 'total', 'atualizado'] as const).find((key) => key === parsed.ordem)
    const direcao = (['asc', 'desc'] as const).find((dir) => dir === parsed.direcao)
    const porPagina = PAGE_SIZES.find((size) => size === parsed.porPagina)
    return {
      ordem: ordem ?? DEFAULT_VIEW.ordem,
      direcao: direcao ?? DEFAULT_VIEW.direcao,
      porPagina: porPagina ?? DEFAULT_VIEW.porPagina,
    }
  } catch {
    return DEFAULT_VIEW
  }
}

export function saveViewPrefs(prefs: ViewPrefs): void {
  safeSetItem('haddad:pacientes-visao', JSON.stringify(prefs))
}
