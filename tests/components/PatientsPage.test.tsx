import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PatientRecord } from '../../src/api/patients'
import { PatientsPage } from '../../src/components/PatientsPage'

function makePatient(overrides: Partial<PatientRecord> & { id: number; nome: string }): PatientRecord {
  return {
    telefone: '11987654321',
    cpf: null,
    simulacao: null,
    criado_em: '2026-09-05T21:49:50.167Z',
    atualizado_em: '2026-09-05T21:49:50.167Z',
    ...overrides,
  }
}

const MARIANA = makePatient({
  id: 1,
  nome: 'Mariana Silva',
  cpf: '12345678900',
  simulacao: {
    tratamentoNome: 'Protocolo sobre implantes',
    valorTratamento: 14800,
    entrada: 2500,
    jurosMensalPct: 3.5,
    modo: 'byTerm',
    parcelas: 18,
    valorParcela: 932.55,
    totalReceber: 19285.85,
  },
})

function stubPatients(list: PatientRecord[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => list }))
}

describe('PatientsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    stubPatients([MARIANA])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carrega e lista os pacientes salvos em uma tabela, com a condição da última simulação', async () => {
    render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)

    expect(await screen.findByText('Mariana Silva')).toBeInTheDocument()
    expect(screen.getByText(/CPF 123\.456\.789-00/)).toBeInTheDocument()
    expect(screen.getByText('(11) 98765-4321 · CPF 123.456.789-00')).toBeInTheDocument()

    const table = screen.getByRole('table')
    expect(within(table).getByText('Protocolo sobre implantes')).toBeInTheDocument()
    expect(within(table).getByText('18× R$ 932,55')).toBeInTheDocument()
    expect(within(table).getByText('R$ 19.285,85')).toBeInTheDocument()
  })

  it('mostra os totais da lista nos cartões de indicadores (dados reais, marcados como simulados)', async () => {
    stubPatients([MARIANA, makePatient({ id: 2, nome: 'Carlos Souza', telefone: '11911112222' })])
    render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)

    await screen.findByText('Mariana Silva')

    const kpis = screen.getByText('Pacientes na lista').closest('.card-surface') as HTMLElement
    expect(within(kpis).getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1 sem simulação')).toBeInTheDocument()
    expect(screen.getByText('A receber (simulado)')).toBeInTheDocument()
  })

  it('mostra a distribuição dos pacientes por tratamento, respeitando os filtros', async () => {
    const user = userEvent.setup()
    stubPatients([
      MARIANA,
      makePatient({ id: 2, nome: 'Carlos Souza', telefone: '11911112222' }),
      makePatient({
        id: 3,
        nome: 'Beatriz Lima',
        telefone: '11933334444',
        simulacao: { ...MARIANA.simulacao!, tratamentoNome: 'Lentes de contato', valorTratamento: 30000, totalReceber: 35000 },
      }),
    ])
    render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
    await screen.findByText('Mariana Silva')

    const card = screen.getByText('Pacientes por tratamento').closest('.card-surface') as HTMLElement
    expect(within(card).getByText('Lentes de contato')).toBeInTheDocument()
    expect(within(card).getByText('1 · R$ 30.000,00')).toBeInTheDocument()
    expect(within(card).getByText('1 · R$ 14.800,00')).toBeInTheDocument()
    expect(within(card).getByText('Sem simulação')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Situação'), 'com')
    expect(within(card).queryByText('Sem simulação')).not.toBeInTheDocument()
  })

  it('abre o painel lateral com os dados completos ao clicar no paciente', async () => {
    const user = userEvent.setup()
    render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)

    await user.click(await screen.findByText('Mariana Silva'))

    const drawer = await screen.findByRole('dialog', { name: 'Mariana Silva' })
    expect(within(drawer).getByText('Protocolo sobre implantes')).toBeInTheDocument()
    expect(within(drawer).getByText('18× de R$ 932,55')).toBeInTheDocument()
    expect(within(drawer).getByText('123.456.789-00')).toBeInTheDocument()
    expect(within(drawer).getByText('R$ 19.285,85')).toBeInTheDocument()
    expect(within(drawer).getByRole('img', { name: 'Entrada de 16,9% do valor do tratamento' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('chama onBack ao clicar em voltar', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<PatientsPage onBack={onBack} onEdit={() => {}} />)

    await user.click(screen.getByLabelText('Voltar ao simulador'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('chama onEdit com o paciente ao clicar em "Editar paciente" no painel', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<PatientsPage onBack={() => {}} onEdit={onEdit} />)

    await user.click(await screen.findByText('Mariana Silva'))
    await user.click(screen.getByRole('button', { name: /Editar paciente/i }))

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Mariana Silva', telefone: '11987654321', cpf: '12345678900' }),
    )
  })

  it('também edita direto pela ação rápida da linha, sem abrir o painel', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<PatientsPage onBack={() => {}} onEdit={onEdit} />)

    await user.click(await screen.findByRole('button', { name: 'Editar Mariana Silva' }))

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('avisa quando não há pacientes e oferece voltar ao simulador', async () => {
    stubPatients([])
    render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)

    expect(await screen.findByText('Nenhum paciente encontrado.')).toBeInTheDocument()
    expect(screen.getByText(/Quando você salvar um paciente no simulador/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('mostra o erro da busca e permite tentar novamente', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Banco indisponível.' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [MARIANA] }),
    )
    render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Banco indisponível.')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Mariana Silva')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  describe('filtros, ordenação e paginação', () => {
    const CARLOS = makePatient({ id: 2, nome: 'Carlos Souza', telefone: '11911112222', atualizado_em: '2026-09-08T10:00:00.000Z' })
    const BEATRIZ = makePatient({
      id: 3,
      nome: 'Beatriz Lima',
      telefone: '11933334444',
      atualizado_em: '2026-09-07T10:00:00.000Z',
      simulacao: {
        tratamentoNome: 'Lentes de contato',
        valorTratamento: 30000,
        entrada: 5000,
        jurosMensalPct: 2,
        modo: 'byTerm',
        parcelas: 12,
        valorParcela: 2500,
        totalReceber: 35000,
      },
    })

    beforeEach(() => stubPatients([MARIANA, CARLOS, BEATRIZ]))

    function rowNames() {
      const body = screen.getAllByRole('rowgroup')[1]
      return within(body)
        .getAllByRole('row')
        .map((row) => within(row).getAllByRole('button')[0].textContent)
    }

    it('filtra por situação da simulação e limpa os filtros', async () => {
      const user = userEvent.setup()
      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await screen.findByText('Mariana Silva')

      await user.selectOptions(screen.getByLabelText('Situação'), 'sem')
      expect(rowNames()).toEqual(['Carlos Souza'])

      await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
      expect(rowNames()).toHaveLength(3)
    })

    it('filtra por tratamento usando só os tratamentos que existem na lista', async () => {
      const user = userEvent.setup()
      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await screen.findByText('Mariana Silva')

      const select = screen.getByLabelText('Tratamento')
      expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Todos',
        'Lentes de contato',
        'Protocolo sobre implantes',
      ])

      await user.selectOptions(select, 'Lentes de contato')
      expect(rowNames()).toEqual(['Beatriz Lima'])
    })

    it('ordena pelo cabeçalho e alterna a direção, informando aria-sort', async () => {
      const user = userEvent.setup()
      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await screen.findByText('Mariana Silva')

      // padrão: atualização mais recente primeiro
      expect(rowNames()).toEqual(['Carlos Souza', 'Beatriz Lima', 'Mariana Silva'])

      const nameHeader = screen.getByRole('columnheader', { name: /Paciente/ })
      await user.click(within(nameHeader).getByRole('button'))
      expect(rowNames()).toEqual(['Beatriz Lima', 'Carlos Souza', 'Mariana Silva']) // A→Z
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

      await user.click(within(nameHeader).getByRole('button'))
      expect(rowNames()).toEqual(['Mariana Silva', 'Carlos Souza', 'Beatriz Lima']) // Z→A
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending')

      // sem simulação vai sempre para o fim quando a ordem é por valor
      const totalHeader = screen.getByRole('columnheader', { name: /Total a receber/ })
      await user.click(within(totalHeader).getByRole('button'))
      expect(rowNames()).toEqual(['Beatriz Lima', 'Mariana Silva', 'Carlos Souza'])
    })

    it('lembra apenas a ordenação e o tamanho da página (nunca dados de pacientes)', async () => {
      const user = userEvent.setup()
      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await screen.findByText('Mariana Silva')

      await user.selectOptions(screen.getByLabelText('Ordenar por'), 'nome:asc')

      const saved = window.localStorage.getItem('haddad:pacientes-visao') ?? ''
      expect(JSON.parse(saved)).toEqual({ ordem: 'nome', direcao: 'asc', porPagina: 10 })
      expect(saved).not.toMatch(/Mariana|Carlos|Beatriz|11987654321/)
    })

    it('pagina a lista e mostra a faixa exibida', async () => {
      const user = userEvent.setup()
      const many = Array.from({ length: 12 }, (_, i) =>
        makePatient({ id: 100 + i, nome: `Paciente ${String(i + 1).padStart(2, '0')}`, telefone: `1190000${String(1000 + i)}` }),
      )
      stubPatients(many)
      window.localStorage.setItem('haddad:pacientes-visao', JSON.stringify({ ordem: 'nome', direcao: 'asc', porPagina: 10 }))
      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await screen.findByText('Paciente 01')

      expect(screen.getByText('Mostrando 1–10 de 12')).toBeInTheDocument()
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
      expect(screen.queryByText('Paciente 11')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Próxima página' }))
      expect(screen.getByText('Mostrando 11–12 de 12')).toBeInTheDocument()
      expect(screen.getByText('Paciente 11')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()

      await user.selectOptions(screen.getByLabelText('Por página'), '20')
      expect(screen.getByText('Mostrando 1–12 de 12')).toBeInTheDocument()
    })
  })

  describe('busca', () => {
    it('busca no servidor depois de uma pausa na digitação, sem uma requisição por tecla', async () => {
      const user = userEvent.setup()
      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await screen.findByText('Mariana Silva')

      const fetchMock = vi.mocked(fetch)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      await user.type(screen.getByLabelText('Buscar por nome ou telefone'), 'Mari')
      expect(fetchMock).toHaveBeenCalledTimes(1)

      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/patients?q=Mari'), { timeout: 2000 })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('usa só a resposta da busca mais recente quando as respostas chegam fora de ordem', async () => {
      const user = userEvent.setup()
      let resolveFirst: (value: unknown) => void = () => {}
      const first = new Promise((resolve) => {
        resolveFirst = resolve
      })
      const fetchMock = vi
        .fn()
        .mockReturnValueOnce(first) // carga inicial (lenta)
        .mockResolvedValueOnce({ ok: true, json: async () => [makePatient({ id: 9, nome: 'Ana Costa' })] })
      vi.stubGlobal('fetch', fetchMock)

      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await user.type(screen.getByLabelText('Buscar por nome ou telefone'), 'Ana{Enter}')
      expect(await screen.findByText('Ana Costa')).toBeInTheDocument()

      resolveFirst({ ok: true, json: async () => [MARIANA] }) // a resposta antiga chega por último
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(screen.getByText('Ana Costa')).toBeInTheDocument()
      expect(screen.queryByText('Mariana Silva')).not.toBeInTheDocument()
    })

    it('explica quando a busca não encontra ninguém', async () => {
      const user = userEvent.setup()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => [MARIANA] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
      vi.stubGlobal('fetch', fetchMock)
      render(<PatientsPage onBack={() => {}} onEdit={() => {}} />)
      await screen.findByText('Mariana Silva')

      await user.type(screen.getByLabelText('Buscar por nome ou telefone'), 'Zzz{Enter}')

      expect(await screen.findByText('Nenhum paciente encontrado.')).toBeInTheDocument()
      expect(screen.getByText(/Nada encontrado para "Zzz"/)).toBeInTheDocument()
    })
  })
})
