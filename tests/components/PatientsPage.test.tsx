import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PatientsPage } from '../../src/components/PatientsPage'

describe('PatientsPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 1,
            nome: 'Mariana Silva',
            telefone: '11987654321',
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
            criado_em: '2026-09-05T21:49:50.167Z',
            atualizado_em: '2026-09-05T21:49:50.167Z',
          },
        ],
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carrega e mostra os pacientes salvos, expandindo para ver a simulação', async () => {
    const user = userEvent.setup()
    render(<PatientsPage onBack={() => {}} />)

    expect(await screen.findByText('Mariana Silva')).toBeInTheDocument()
    expect(screen.queryByText('Protocolo sobre implantes')).not.toBeInTheDocument()

    await user.click(screen.getByText('Mariana Silva'))

    expect(await screen.findByText('Protocolo sobre implantes')).toBeInTheDocument()
    expect(screen.getByText('18× de R$ 932,55')).toBeInTheDocument()
  })

  it('chama onBack ao clicar em voltar', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<PatientsPage onBack={onBack} />)

    await user.click(screen.getByLabelText('Voltar ao simulador'))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
