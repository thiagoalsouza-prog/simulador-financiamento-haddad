import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App'

describe('cenário 11 — separação entre visão comercial e área gerencial', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('oculta informações gerenciais na visão comercial e exibe na área gerencial', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText(/Informações internas/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Custo direto/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Área gerencial/i }))

    expect(screen.getByText(/Informações internas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Custo direto/i)).toBeInTheDocument()
  })

  it('exibe a condição calculada com os valores iniciais sugeridos', () => {
    render(<App />)
    expect(screen.getByText(/18×/)).toBeInTheDocument()
  })

  it('cenário 10 — funciona com nome e CPF vazios', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Gerar proposta/i }))

    const dialog = await screen.findByRole('dialog', { name: /Proposta comercial/i })
    expect(dialog).toHaveTextContent('Olá! Tudo bem?')
  })
})
