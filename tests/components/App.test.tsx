import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App'

async function fillPatientInfo(user: UserEvent) {
  await user.type(screen.getByLabelText('Nome do paciente'), 'Mariana Silva')
  await user.type(screen.getByLabelText('Telefone'), '11987654321')
  await user.type(screen.getByLabelText('CPF'), '12345678900')
}

describe('cenário 11 — separação entre visão comercial e área gerencial', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('oculta informações gerenciais na visão comercial e exibe na área gerencial', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText(/Informações internas/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Custo direto/i)).not.toBeInTheDocument()

    await fillPatientInfo(user)
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

  it('exibe a condição calculada assim que nome, telefone e CPF são preenchidos', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillPatientInfo(user)

    expect(await screen.findByText(/18×/)).toBeInTheDocument()
  })

  it('gera a proposta comercial depois de preencher os dados do paciente', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillPatientInfo(user)

    await user.click(await screen.findByRole('button', { name: /Gerar proposta/i }))

    const dialog = await screen.findByRole('dialog', { name: /Proposta comercial/i })
    expect(dialog).toHaveTextContent('Olá, Mariana Silva! Tudo bem?')
  })
})
