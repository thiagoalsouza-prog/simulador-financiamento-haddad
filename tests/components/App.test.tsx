import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

async function fillPatientInfo(user: UserEvent) {
  await user.type(screen.getByLabelText('Nome do paciente'), 'Mariana Silva')
  await user.type(screen.getByLabelText('Telefone'), '11987654321')
  await user.type(screen.getByLabelText('CPF'), '12345678900')
}

async function fillAndSavePatient(user: UserEvent) {
  await fillPatientInfo(user)
  await user.click(screen.getByRole('button', { name: /Salvar paciente/i }))
  expect(await screen.findByRole('button', { name: /Paciente salvo/i })).toBeInTheDocument()
}

describe('cenário 11 — app sempre em modo gerencial', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 1,
          nome: 'Mariana Silva',
          telefone: '11987654321',
          simulacao: null,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        }),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exibe informações gerenciais (custo direto, resultado, risco) sem precisar de alternância de visão', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByLabelText(/Custo direto/i)).toBeInTheDocument()

    await fillAndSavePatient(user)

    expect(await screen.findByText(/Informações internas/i)).toBeInTheDocument()
  })

  it('não calcula a condição enquanto nome, telefone e CPF do paciente não são informados', () => {
    render(<App />)
    expect(screen.queryByText(/18×/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/Preencha nome, CPF, telefone do paciente e os dados do tratamento/i),
    ).toBeInTheDocument()
  })

  it('não calcula a condição só de preencher os dados — exige salvar o paciente primeiro', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillPatientInfo(user)

    expect(screen.queryByText(/18×/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/Clique em "Salvar paciente" para liberar o cálculo da condição de pagamento/i),
    ).toBeInTheDocument()
  })

  it('exibe a condição calculada depois de salvar o paciente', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillAndSavePatient(user)

    expect(await screen.findByText(/18×/)).toBeInTheDocument()
  })

  it('gera a proposta comercial depois de salvar os dados do paciente', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillAndSavePatient(user)

    await user.click(await screen.findByRole('button', { name: /Gerar proposta/i }))

    const dialog = await screen.findByRole('dialog', { name: /Proposta comercial/i })
    expect(dialog).toHaveTextContent('Olá, Mariana Silva! Tudo bem?')
  })
})

describe('cenário 13 — editar paciente já consultado', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          const body = JSON.parse(init.body as string) as {
            name: string
            phone: string
            cpf: string
            simulation: unknown
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 1,
              nome: body.name,
              telefone: body.phone,
              cpf: body.cpf || null,
              simulacao: body.simulation,
              criado_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString(),
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              nome: 'Mariana Silva',
              telefone: '11987654321',
              cpf: '12345678900',
              simulacao: {
                tratamentoNome: 'Personalizado',
                valorTratamento: 14800,
                entrada: 2500,
                jurosMensalPct: 3.5,
                modo: 'byTerm',
                parcelas: 18,
                valorParcela: 932.55,
                totalReceber: 19285.85,
              },
              criado_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString(),
            },
          ],
        })
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carrega nome, telefone, CPF e simulação ao editar — recalcula sem precisar redigitar nada', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Pesquisar paciente/i }))
    await user.click(await screen.findByText('Mariana Silva'))
    await user.click(await screen.findByRole('button', { name: /Editar paciente/i }))

    expect(await screen.findByLabelText('Nome do paciente')).toHaveValue('Mariana Silva')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 98765-4321')
    expect(screen.getByLabelText('CPF')).toHaveValue('123.456.789-00')
    expect(screen.getByLabelText('Valor do tratamento')).toHaveValue('14.800,00')

    expect(await screen.findByText(/18×/)).toBeInTheDocument()
  })
})
