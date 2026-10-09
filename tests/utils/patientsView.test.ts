import { beforeEach, describe, expect, it } from 'vitest'
import type { PatientRecord } from '../../src/api/patients'
import {
  DEFAULT_VIEW,
  NO_FILTERS,
  distributionByTreatment,
  filterPatients,
  hasActiveFilters,
  loadViewPrefs,
  paginate,
  saveViewPrefs,
  sortPatients,
  summarizePatients,
  treatmentOptions,
} from '../../src/utils/patientsView'

function patient(id: number, nome: string, extra: Partial<PatientRecord> = {}): PatientRecord {
  return {
    id,
    nome,
    telefone: '11987654321',
    cpf: null,
    simulacao: null,
    criado_em: '2026-09-01T12:00:00.000Z',
    atualizado_em: '2026-09-01T12:00:00.000Z',
    ...extra,
  }
}

function withSim(id: number, nome: string, tratamentoNome: string, valorTratamento: number, totalReceber: number, extra: Partial<PatientRecord> = {}) {
  return patient(id, nome, {
    simulacao: {
      tratamentoNome,
      valorTratamento,
      entrada: 1000,
      jurosMensalPct: 3,
      modo: 'byTerm',
      parcelas: 12,
      valorParcela: 500,
      totalReceber,
    },
    ...extra,
  })
}

const NOW = new Date('2026-09-10T15:00:00.000Z')

describe('lista de pacientes — filtros', () => {
  const list = [
    withSim(1, 'Ana', 'Implante', 10000, 12000, { atualizado_em: '2026-09-10T13:00:00.000Z' }), // hoje
    withSim(2, 'Bruno', 'Lente', 20000, 25000, { atualizado_em: '2026-09-05T10:00:00.000Z' }), // 5 dias
    patient(3, 'Carla', { atualizado_em: '2026-08-01T10:00:00.000Z' }), // sem simulação, 40 dias
    patient(4, 'Davi', { atualizado_em: 'data inválida' }),
  ]

  it('sem filtros mantém todos e não conta como filtro ativo', () => {
    expect(filterPatients(list, NO_FILTERS, NOW)).toHaveLength(4)
    expect(hasActiveFilters(NO_FILTERS)).toBe(false)
  })

  it('filtra por situação da simulação', () => {
    expect(filterPatients(list, { ...NO_FILTERS, situacao: 'com' }, NOW).map((p) => p.nome)).toEqual(['Ana', 'Bruno'])
    expect(filterPatients(list, { ...NO_FILTERS, situacao: 'sem' }, NOW).map((p) => p.nome)).toEqual(['Carla', 'Davi'])
  })

  it('filtra pelo tratamento da última simulação (quem não tem simulação nunca casa)', () => {
    const result = filterPatients(list, { ...NO_FILTERS, tratamento: 'Lente' }, NOW)
    expect(result.map((p) => p.nome)).toEqual(['Bruno'])
    expect(hasActiveFilters({ ...NO_FILTERS, tratamento: 'Lente' })).toBe(true)
  })

  it('filtra por período de atualização e ignora datas inválidas', () => {
    expect(filterPatients(list, { ...NO_FILTERS, periodo: 'hoje' }, NOW).map((p) => p.nome)).toEqual(['Ana'])
    expect(filterPatients(list, { ...NO_FILTERS, periodo: '7d' }, NOW).map((p) => p.nome)).toEqual(['Ana', 'Bruno'])
    expect(filterPatients(list, { ...NO_FILTERS, periodo: '30d' }, NOW).map((p) => p.nome)).toEqual(['Ana', 'Bruno'])
  })

  it('combina os filtros (todos precisam valer)', () => {
    const result = filterPatients(list, { situacao: 'com', tratamento: 'Implante', periodo: '7d' }, NOW)
    expect(result.map((p) => p.nome)).toEqual(['Ana'])
  })
})

describe('lista de pacientes — ordenação', () => {
  const list = [
    withSim(1, 'Érica', 'A', 5000, 7000, { atualizado_em: '2026-09-02T00:00:00.000Z' }),
    patient(2, 'bruno', { atualizado_em: '2026-09-09T00:00:00.000Z' }),
    withSim(3, 'Carla', 'B', 9000, 4000, { atualizado_em: '2026-09-05T00:00:00.000Z' }),
  ]

  it('ordena nomes ignorando acento e caixa', () => {
    expect(sortPatients(list, 'nome', 'asc').map((p) => p.nome)).toEqual(['bruno', 'Carla', 'Érica'])
    expect(sortPatients(list, 'nome', 'desc').map((p) => p.nome)).toEqual(['Érica', 'Carla', 'bruno'])
  })

  it('ordena por data de atualização', () => {
    expect(sortPatients(list, 'atualizado', 'desc').map((p) => p.nome)).toEqual(['bruno', 'Carla', 'Érica'])
  })

  it('ordena por valores e deixa quem não tem simulação sempre no fim, nas duas direções', () => {
    expect(sortPatients(list, 'valor', 'desc').map((p) => p.nome)).toEqual(['Carla', 'Érica', 'bruno'])
    expect(sortPatients(list, 'valor', 'asc').map((p) => p.nome)).toEqual(['Érica', 'Carla', 'bruno'])
    expect(sortPatients(list, 'total', 'desc').map((p) => p.nome)).toEqual(['Érica', 'Carla', 'bruno'])
  })

  it('não altera a lista original', () => {
    const copy = [...list]
    sortPatients(list, 'nome', 'asc')
    expect(list).toEqual(copy)
  })
})

describe('lista de pacientes — totais e opções', () => {
  const list = [
    withSim(1, 'Ana', 'Lente', 10000, 12000),
    withSim(2, 'Bruno', 'Implante', 20000, 25000),
    withSim(3, 'Caio', 'Lente', 5000, 6000),
    patient(4, 'Davi'),
  ]

  it('soma apenas pacientes com simulação', () => {
    expect(summarizePatients(list)).toEqual({
      total: 4,
      withSimulation: 3,
      simulatedValue: 35000,
      simulatedReceivable: 43000,
    })
  })

  it('lista vazia gera totais zerados', () => {
    expect(summarizePatients([])).toEqual({ total: 0, withSimulation: 0, simulatedValue: 0, simulatedReceivable: 0 })
  })

  it('lista os tratamentos sem repetir, em ordem alfabética', () => {
    expect(treatmentOptions(list)).toEqual(['Implante', 'Lente'])
  })
})

describe('lista de pacientes — distribuição por tratamento', () => {
  it('agrupa pela última simulação, do grupo maior para o menor, somando valores reais', () => {
    const list = [
      withSim(1, 'Ana', 'Lente', 10000, 12000),
      withSim(2, 'Bruno', 'Implante', 20000, 25000),
      withSim(3, 'Caio', 'Lente', 5000, 6000),
      patient(4, 'Davi'),
    ]
    expect(distributionByTreatment(list)).toEqual([
      { label: 'Lente', count: 2, value: 15000 },
      { label: 'Implante', count: 1, value: 20000 },
      { label: 'Sem simulação', count: 1, value: 0 },
    ])
  })

  it('empates são desempatados pelo nome, para a ordem não mudar a cada carga', () => {
    const list = [withSim(1, 'Ana', 'Zeta', 100, 120), withSim(2, 'Bia', 'Alfa', 100, 120)]
    expect(distributionByTreatment(list).map((group) => group.label)).toEqual(['Alfa', 'Zeta'])
  })

  it('passando do limite, o excedente vira "Outros" sem perder nenhum paciente', () => {
    const list = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((name, index) => withSim(index + 1, `P${index}`, name, 1000, 1200))
    const result = distributionByTreatment(list, 4)
    expect(result).toHaveLength(4)
    expect(result[3]).toEqual({ label: 'Outros', count: 4, value: 4000 })
    expect(result.reduce((sum, group) => sum + group.count, 0)).toBe(7)
  })

  it('lista vazia não gera grupos', () => {
    expect(distributionByTreatment([])).toEqual([])
  })
})

describe('lista de pacientes — paginação', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1)

  it('divide em páginas e informa a faixa exibida', () => {
    expect(paginate(items, 1, 10)).toMatchObject({ page: 1, pages: 3, from: 1, to: 10 })
    expect(paginate(items, 3, 10)).toMatchObject({ page: 3, pages: 3, from: 21, to: 23, rows: [21, 22, 23] })
  })

  it('corrige páginas fora do limite', () => {
    expect(paginate(items, 99, 10).page).toBe(3)
    expect(paginate(items, 0, 10).page).toBe(1)
    expect(paginate(items, Number.NaN, 10).page).toBe(1)
  })

  it('lista vazia tem uma página e faixa 0–0', () => {
    expect(paginate([], 1, 10)).toEqual({ rows: [], page: 1, pages: 1, from: 0, to: 0 })
  })
})

describe('lista de pacientes — preferências de visualização', () => {
  beforeEach(() => window.localStorage.clear())

  it('sem nada salvo usa o padrão (mais recentes primeiro, 10 por página)', () => {
    expect(loadViewPrefs()).toEqual(DEFAULT_VIEW)
  })

  it('salva e recupera ordenação e tamanho da página', () => {
    saveViewPrefs({ ordem: 'total', direcao: 'asc', porPagina: 50 })
    expect(loadViewPrefs()).toEqual({ ordem: 'total', direcao: 'asc', porPagina: 50 })
  })

  it('valores inválidos ou JSON quebrado voltam ao padrão', () => {
    window.localStorage.setItem('haddad:pacientes-visao', 'isto não é json')
    expect(loadViewPrefs()).toEqual(DEFAULT_VIEW)

    window.localStorage.setItem('haddad:pacientes-visao', JSON.stringify({ ordem: 'cpf', direcao: 'x', porPagina: 7 }))
    expect(loadViewPrefs()).toEqual(DEFAULT_VIEW)
  })
})
