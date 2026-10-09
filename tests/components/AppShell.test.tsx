import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Calculator, Users } from 'lucide-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell, type NavGroup } from '../../src/components/shell/AppShell'
import type { Theme } from '../../src/storage/theme'

function setup(theme: Theme = 'escuro') {
  const onSimulator = vi.fn()
  const onPatients = vi.fn()
  const onToggleTheme = vi.fn()
  const onSearchPatients = vi.fn()
  const groups: NavGroup[] = [
    {
      title: 'Atendimento',
      items: [
        { id: 'sim', label: 'Simulador', icon: Calculator, active: true, onSelect: onSimulator },
        { id: 'pac', label: 'Pacientes salvos', icon: Users, onSelect: onPatients },
      ],
    },
  ]
  render(
    <AppShell groups={groups} theme={theme} onToggleTheme={onToggleTheme} onSearchPatients={onSearchPatients}>
      <p>Conteúdo da página</p>
    </AppShell>,
  )
  return { onSimulator, onPatients, onToggleTheme, onSearchPatients }
}

describe('AppShell — menu lateral', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('mostra o conteúdo na região principal, com link para pular a navegação', () => {
    setup()
    expect(within(screen.getByRole('main')).getByText('Conteúdo da página')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo')
  })

  it('marca só a página atual com aria-current e chama onSelect ao clicar', async () => {
    const user = userEvent.setup()
    const { onPatients } = setup()

    expect(screen.getByRole('button', { name: 'Simulador' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Pacientes salvos' })).not.toHaveAttribute('aria-current')

    await user.click(screen.getByRole('button', { name: 'Pacientes salvos' }))
    expect(onPatients).toHaveBeenCalledOnce()
  })

  it('recolhe e expande o menu, lembrando a escolha neste aparelho', async () => {
    const user = userEvent.setup()
    setup()

    expect(screen.getByText('Atendimento')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Recolher menu' }))
    expect(window.localStorage.getItem('menu-recolhido')).toBe('1')
    expect(screen.queryByText('Atendimento')).not.toBeInTheDocument()
    // recolhido, os itens continuam com nome acessível
    expect(screen.getByRole('button', { name: 'Pacientes salvos' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expandir menu' }))
    expect(window.localStorage.getItem('menu-recolhido')).toBe('0')
    expect(screen.getByText('Atendimento')).toBeInTheDocument()
  })

  it('abre já recolhido quando essa foi a última escolha', () => {
    window.localStorage.setItem('menu-recolhido', '1')
    setup()
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()
  })

  it('abre a busca de pacientes com Ctrl+K e com ⌘K, sem acionar o atalho do navegador', async () => {
    const user = userEvent.setup()
    const { onSearchPatients } = setup()

    await user.keyboard('{Control>}k{/Control}')
    expect(onSearchPatients).toHaveBeenCalledTimes(1)

    await user.keyboard('{Meta>}k{/Meta}')
    expect(onSearchPatients).toHaveBeenCalledTimes(2)

    await user.keyboard('k')
    expect(onSearchPatients).toHaveBeenCalledTimes(2)
  })

  it('o botão "Pesquisar paciente" chama a busca', async () => {
    const user = userEvent.setup()
    const { onSearchPatients } = setup()
    await user.click(screen.getByRole('button', { name: /Pesquisar paciente/ }))
    expect(onSearchPatients).toHaveBeenCalledOnce()
  })

  it('alterna o tema pelo botão, com o nome certo para cada estado', async () => {
    const user = userEvent.setup()
    const { onToggleTheme } = setup('escuro')
    await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }))
    expect(onToggleTheme).toHaveBeenCalledOnce()
  })

  it('no tema claro o botão oferece voltar ao escuro', () => {
    setup('claro')
    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument()
  })
})

describe('AppShell — celular', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('abre o menu em uma gaveta, navega e fecha sozinha', async () => {
    const user = userEvent.setup()
    const { onPatients } = setup()

    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    await user.click(within(drawer).getByRole('button', { name: 'Pacientes salvos' }))

    expect(onPatients).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
  })

  it('a gaveta fecha com Esc e pelo botão de fechar', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await user.click(screen.getByRole('button', { name: 'Fechar menu' }))
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
  })

  it('o ícone de busca da barra superior abre a busca de pacientes', async () => {
    const user = userEvent.setup()
    const { onSearchPatients } = setup()
    await user.click(screen.getByRole('button', { name: 'Buscar pacientes' }))
    expect(onSearchPatients).toHaveBeenCalledOnce()
  })
})
