import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as { name: string; phone: string; cpf: string; simulation: unknown }
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
      return Promise.resolve({ ok: true, json: async () => [] })
    }),
  )
}

describe('layout — menu lateral, tema e navegação', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.tema
    stubFetch()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete document.documentElement.dataset.tema
  })

  it('abre no tema escuro e não grava nada no aparelho só por abrir o sistema', () => {
    render(<App />)
    expect(document.documentElement.dataset.tema).toBeUndefined()
    expect(window.localStorage.getItem('tema')).toBeNull()
  })

  it('alterna entre escuro e claro pelo menu e lembra a escolha', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }))
    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(window.localStorage.getItem('tema')).toBe('claro')

    await user.click(screen.getByRole('button', { name: 'Ativar tema escuro' }))
    expect(document.documentElement.dataset.tema).toBeUndefined()
    expect(window.localStorage.getItem('tema')).toBe('escuro')
  })

  it('volta no tema claro quando essa foi a última escolha', () => {
    window.localStorage.setItem('tema', 'claro')
    render(<App />)
    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument()
  })

  it('o simulador é a página inicial e destaca o item atual do menu', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Planejamento financeiro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simulador' })).toHaveAttribute('aria-current', 'page')
  })

  it('navega para os pacientes salvos pelo menu e volta ao simulador', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Pacientes salvos' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Pacientes salvos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pacientes salvos' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Simulador' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Planejamento financeiro' })).toBeInTheDocument()
  })

  it('Ctrl+K abre a pesquisa de pacientes a partir do simulador', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.keyboard('{Control>}k{/Control}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pacientes salvos' })).toBeInTheDocument()
  })

  it('abre o cadastro de tratamentos e a política de risco pelo menu', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Tratamentos cadastrados' }))
    const treatments = await screen.findByRole('dialog', { name: 'Tratamentos cadastrados' })
    expect(within(treatments).getByRole('heading', { name: 'Adicionar tratamento' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Política de risco' }))
    expect(await screen.findByRole('dialog', { name: 'Política de risco' })).toBeInTheDocument()
  })

  it('salvar a política de risco fecha a janela e avisa que foi atualizada', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Política de risco' }))
    await user.click(await screen.findByRole('button', { name: 'Salvar parâmetros' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const notifications = screen.getByRole('region', { name: 'Notificações' })
    expect(within(notifications).getByText('Política de risco atualizada')).toBeInTheDocument()
  })

  it('cadastra um tratamento novo e o oferece na lista do simulador', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Tratamentos cadastrados' }))
    const dialog = await screen.findByRole('dialog', { name: 'Tratamentos cadastrados' })

    await user.type(within(dialog).getByLabelText('Nome'), 'Clareamento a laser')
    await user.type(within(dialog).getByLabelText('Valor'), '1200')
    await user.type(within(dialog).getByLabelText('Custo direto'), '300')
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar tratamento' }))

    expect(within(dialog).getByText('Clareamento a laser')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Notificações' })).getByText('Tratamento adicionado')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('option', { name: 'Clareamento a laser' })).toBeInTheDocument()
  })

  it('avisa com uma notificação quando o paciente é salvo', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Nome do paciente'), 'Mariana Silva')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/i }))

    const notifications = screen.getByRole('region', { name: 'Notificações' })
    expect(await within(notifications).findByText('Paciente salvo')).toBeInTheDocument()
  })

  it('o formulário limpo não nasce com erros: eles aparecem ao sair do campo ou ao tentar salvar', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Informe o nome do paciente.')).not.toBeInTheDocument()
    expect(screen.queryByText('Informe um telefone válido com DDD.')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Nome do paciente'))
    await user.tab()
    expect(screen.getByText('Informe o nome do paciente.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome do paciente')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('Informe um telefone válido com DDD.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Salvar paciente/i }))
    expect(screen.getByText('Informe um telefone válido com DDD.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Informe nome completo e um telefone válido com DDD.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('se o salvamento falhar, mostra o motivo, mantém o paciente como pendente e não libera o cálculo', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Erro ao conectar ao banco de dados.' }) }))
    render(<App />)

    await user.type(screen.getByLabelText('Nome do paciente'), 'Mariana Silva')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao conectar ao banco de dados.')
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.queryByText(/18×/)).not.toBeInTheDocument()
    expect(screen.queryByText('Área gerencial')).not.toBeInTheDocument()
  })

  it('o resultado calculado vira indicadores e a análise gerencial só aparece depois de salvar', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Área gerencial')).not.toBeInTheDocument()
    // enquanto bloqueado, mostra o que falta para liberar o cálculo
    expect(screen.getByText('Nome e telefone do paciente')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nome do paciente'), 'Mariana Silva')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/i }))

    expect(await screen.findByText('Área gerencial')).toBeInTheDocument()
    expect(screen.getByText('Saldo financiado')).toBeInTheDocument()
    expect(screen.getByText('Total a receber')).toBeInTheDocument()
    expect(screen.getByText('Resultado da operação')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Recuperação do custo e do valor principal/ })).toBeInTheDocument()
  })

  it('mostra de que é feito o total a receber: entrada, principal financiado e juros (somam 100%)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Nome do paciente'), 'Mariana Silva')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/i }))

    const bar = await screen.findByRole('img', { name: /^Composição do total a receber:/ })
    const label = bar.getAttribute('aria-label') ?? ''
    expect(label).toMatch(/Entrada R\$\s2\.500,00 \(13%\)/)
    expect(label).toMatch(/Principal financiado R\$\s12\.300,00 \(64%\)/)
    expect(label).toMatch(/Juros do financiamento R\$\s4\.485,85 \(23%\)/)
  })

  it('comparar cenário adiciona uma coluna e avisa', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Nome do paciente'), 'Mariana Silva')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')
    await user.click(screen.getByRole('button', { name: /Salvar paciente/i }))
    await user.click(await screen.findByRole('button', { name: 'Comparar cenário' }))

    expect(await screen.findByRole('columnheader', { name: 'Cenário 1' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Notificações' })).getByText('Cenário adicionado à comparação')).toBeInTheDocument()
  })
})
