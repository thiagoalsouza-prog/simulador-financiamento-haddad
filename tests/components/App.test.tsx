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

describe('cenário 11 — separação entre visão comercial e área gerencial', () => {
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

  it('oculta informações gerenciais na visão comercial e exibe na área gerencial', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText(/Informações internas/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Custo direto/i)).not.toBeInTheDocument()

    await fillAndSavePatient(user)
    await user.click(screen.getByRole('button', { name: /Área gerencial/i }))

    expect(await screen.findByText(/Informações internas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Custo direto/i)).toBeInTheDocument()
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
