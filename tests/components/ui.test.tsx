import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Wallet } from 'lucide-react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Modal } from '../../src/components/Modal'
import { Alert } from '../../src/components/ui/Alert'
import { Badge } from '../../src/components/ui/Badge'
import { BarList } from '../../src/components/ui/BarList'
import { Button, ButtonLink } from '../../src/components/ui/Button'
import { Drawer } from '../../src/components/ui/Drawer'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { ProgressRing } from '../../src/components/ui/ProgressRing'
import { SegmentedControl } from '../../src/components/ui/SegmentedControl'
import { Sparkline } from '../../src/components/ui/Sparkline'
import { StackedBar } from '../../src/components/ui/StackedBar'
import { StatCard } from '../../src/components/ui/StatCard'
import { ToastProvider } from '../../src/components/ui/Toast'
import { Tooltip } from '../../src/components/ui/Tooltip'
import { useToast } from '../../src/components/ui/useToast'
import { applyTheme, loadTheme, saveTheme } from '../../src/storage/theme'

describe('StatCard', () => {
  it('mostra rótulo e valor; sem período anterior não inventa variação nem gráfico', () => {
    render(<StatCard rotulo="Total a receber" valor="R$ 1.000,00" icone={Wallet} />)

    expect(screen.getByText('Total a receber')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    expect(document.querySelector('svg[role="img"]')).toBeNull()
  })

  it('calcula a variação contra o período anterior e explica o valor antigo', () => {
    render(<StatCard rotulo="Receita" valor="125" atual={125} anterior={100} rotuloAnterior="mês passado" />)

    const badge = screen.getByText('+25%')
    expect(badge).toHaveClass('text-success')
    expect(badge).toHaveAttribute('title', expect.stringContaining('mês passado'))
  })

  it('subir pode ser ruim: a cor acompanha o sentido do indicador', () => {
    render(<StatCard rotulo="Inadimplência" valor="125" atual={125} anterior={100} subirEhBom={false} />)
    expect(screen.getByText('+25%')).toHaveClass('text-danger')
  })

  it('variação sem base (anterior = 0) mostra a diferença absoluta em vez de dividir por zero', () => {
    render(<StatCard rotulo="Novos" valor="8" atual={8} anterior={0} />)
    expect(screen.getByText('+8')).toBeInTheDocument()
  })

  it('desenha o mini gráfico só com dois ou mais pontos reais', () => {
    const { rerender } = render(<StatCard rotulo="Saldo" valor="1" serie={[5]} rotuloSerie="Saldo por parcela" />)
    expect(screen.queryByRole('img', { name: 'Saldo por parcela' })).not.toBeInTheDocument()

    rerender(<StatCard rotulo="Saldo" valor="1" serie={[5, 4, 2]} rotuloSerie="Saldo por parcela" />)
    expect(screen.getByRole('img', { name: 'Saldo por parcela' })).toBeInTheDocument()
  })

  it('a dica fica ligada ao botão de informação por aria-describedby', () => {
    render(<StatCard rotulo="Margem" valor="10%" dica="Resultado dividido pelo total." />)

    const button = screen.getByRole('button', { name: 'Como é calculado' })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Resultado dividido pelo total.')
    expect(button).toHaveAttribute('aria-describedby', tooltip.id)
  })
})

describe('Sparkline e ProgressRing', () => {
  it('não renderiza nada com menos de dois pontos', () => {
    const { container } = render(<Sparkline valores={[1]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('anel de progresso limita o valor entre 0 e 100 e é anunciado pelo rótulo', () => {
    render(<ProgressRing value={140} label="Recuperação do custo" />)
    const ring = screen.getByRole('img', { name: 'Recuperação do custo' })
    const progress = ring.querySelectorAll('circle')[1]
    expect(Number(progress.getAttribute('stroke-dashoffset'))).toBeCloseTo(0)
  })
})

describe('StackedBar e BarList', () => {
  const segments = [
    { label: 'Entrada', value: 25, color: 'var(--cyan)', display: 'R$ 25,00' },
    { label: 'Principal', value: 75, color: 'var(--primary)', display: 'R$ 75,00' },
    { label: 'Juros', value: 0, color: 'var(--warning)', display: 'R$ 0,00' },
  ]

  it('StackedBar: cada parte ocupa a sua fatia e a descrição acessível resume a composição', () => {
    render(<StackedBar ariaLabel="Composição" segments={segments} />)

    const bar = screen.getByRole('img', { name: 'Composição: Entrada R$ 25,00 (25%), Principal R$ 75,00 (75%), Juros R$ 0,00 (0%)' })
    const widths = [...bar.children].map((child) => (child as HTMLElement).style.width)
    expect(widths).toEqual(['25%', '75%']) // a parte zerada some da barra, mas fica na legenda
    expect(screen.getByText('Juros')).toBeInTheDocument()
  })

  it('StackedBar: total zero não divide por zero', () => {
    render(<StackedBar ariaLabel="Vazio" segments={segments.map((segment) => ({ ...segment, value: 0 }))} />)
    const bar = screen.getByRole('img', { name: /Vazio:/ })
    expect(bar.children).toHaveLength(0)
    expect(bar).toHaveAttribute('aria-label', expect.stringContaining('(0%)'))
  })

  it('BarList: a maior barra ocupa 100% e as outras seguem a mesma escala', () => {
    const { container } = render(
      <BarList
        items={[
          { label: 'Implante', value: 4, detail: '4 · R$ 20.000,00' },
          { label: 'Lente', value: 2, detail: '2' },
        ]}
      />,
    )
    expect(screen.getByText('Implante')).toBeInTheDocument()
    expect(screen.getByText('4 · R$ 20.000,00')).toBeInTheDocument()
    const fills = [...container.querySelectorAll<HTMLElement>('div[aria-hidden] > div')].map((fill) => fill.style.width)
    expect(fills).toEqual(['100%', '50%'])
  })

  it('BarList: valores zerados ficam com barra vazia', () => {
    const { container } = render(<BarList items={[{ label: 'A', value: 0 }]} />)
    expect(container.querySelector<HTMLElement>('div[aria-hidden] > div')?.style.width).toBe('0%')
  })
})

describe('Button, Badge, Alert, EmptyState', () => {
  it('botão tem type="button" por padrão (não envia formulários sem querer)', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button')
  })

  it('link com aparência de botão mantém href e destino', () => {
    render(
      <ButtonLink href="https://wa.me/55" target="_blank" rel="noopener noreferrer">
        Abrir WhatsApp
      </ButtonLink>,
    )
    expect(screen.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveAttribute('href', 'https://wa.me/55')
  })

  it('selo, aviso e estado vazio exibem o conteúdo recebido', () => {
    render(
      <>
        <Badge tom="sucesso" ponto>
          Salvo
        </Badge>
        <Alert tone="danger" title="Erro" role="alert">
          Não foi possível salvar.
        </Alert>
        <EmptyState titulo="Nada por aqui" descricao="Adicione o primeiro item." acao={<Button>Adicionar</Button>} />
      </>,
    )
    expect(screen.getByText('Salvo')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.')
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument()
  })
})

describe('SegmentedControl', () => {
  function Harness() {
    const [value, setValue] = useState<'a' | 'b' | 'c'>('a')
    return (
      <SegmentedControl
        ariaLabel="Modo"
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'Um' },
          { value: 'b', label: 'Dois' },
          { value: 'c', label: 'Três' },
        ]}
      />
    )
  }

  it('é um grupo de opções exclusivas, navegável pelas setas do teclado', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByRole('radiogroup', { name: 'Modo' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Um' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Um' }))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Dois' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Dois' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Três' })).toBeChecked()
  })
})

describe('Tooltip', () => {
  it('liga a dica ao elemento e a mantém no DOM para leitores de tela', () => {
    render(
      <Tooltip content="Explicação curta">
        <button type="button">Ajuda</button>
      </Tooltip>,
    )
    const tooltip = screen.getByRole('tooltip')
    expect(screen.getByRole('button', { name: 'Ajuda' })).toHaveAttribute('aria-describedby', tooltip.id)
  })
})

describe('Modal e Drawer', () => {
  function WithTrigger({ kind }: { kind: 'modal' | 'drawer' }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Abrir
        </button>
        {kind === 'modal' ? (
          <Modal open={open} title="Janela" onClose={() => setOpen(false)}>
            <button type="button">Dentro</button>
          </Modal>
        ) : (
          <Drawer open={open} title="Painel" onClose={() => setOpen(false)}>
            <button type="button">Dentro</button>
          </Drawer>
        )}
      </>
    )
  }

  it.each(['modal', 'drawer'] as const)('%s: foco entra, Esc fecha e o foco volta para quem abriu', async (kind) => {
    const user = userEvent.setup()
    render(<WithTrigger kind={kind} />)

    const trigger = screen.getByRole('button', { name: 'Abrir' })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('o Tab fica preso dentro do diálogo', async () => {
    const user = userEvent.setup()
    render(<WithTrigger kind="modal" />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    const close = screen.getByRole('button', { name: 'Fechar' })
    const inside = screen.getByRole('button', { name: 'Dentro' })

    await user.tab()
    expect(close).toHaveFocus()
    await user.tab()
    expect(inside).toHaveFocus()
    await user.tab() // última → volta para a primeira
    expect(close).toHaveFocus()
    await user.tab({ shift: true }) // primeira → vai para a última
    expect(inside).toHaveFocus()
  })

  it('clicar no fundo escuro fecha', async () => {
    const user = userEvent.setup()
    render(<WithTrigger kind="drawer" />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    const backdrop = screen.getByRole('dialog').previousElementSibling as HTMLElement
    await user.pointer({ keys: '[MouseLeft]', target: backdrop })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('notificações (Toast)', () => {
  function Pusher({ tone }: { tone: 'success' | 'error' | 'info' }) {
    const toast = useToast()
    return (
      <button type="button" onClick={() => toast.push({ tone, title: 'Feito!', description: 'Detalhe' })}>
        Avisar
      </button>
    )
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mostra o aviso como status e some sozinho depois de alguns segundos', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <Pusher tone="success" />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Avisar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Feito!')
    expect(screen.getByRole('status')).toHaveTextContent('Detalhe')

    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('erros usam role="alert" e ficam mais tempo na tela', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <Pusher tone="error" />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Avisar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Feito!')

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('pode ser fechado manualmente', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <Pusher tone="info" />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Avisar' }))
    await user.click(screen.getByRole('button', { name: 'Fechar notificação' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('sem o provider, chamar useToast não quebra nada', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Pusher tone="info" />)
    await user.click(screen.getByRole('button', { name: 'Avisar' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('tema claro/escuro', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.tema
  })

  it('escuro é o padrão', () => {
    expect(loadTheme()).toBe('escuro')
  })

  it('lembra a escolha e ignora valores inválidos', () => {
    saveTheme('claro')
    expect(loadTheme()).toBe('claro')

    window.localStorage.setItem('tema', 'roxo')
    expect(loadTheme()).toBe('escuro')
  })

  it('quem já usava o tema claro antes do novo design continua no claro', () => {
    window.localStorage.setItem('haddad:theme', 'light')
    expect(loadTheme()).toBe('claro')

    window.localStorage.setItem('tema', 'escuro') // a escolha nova vale mais que a antiga
    expect(loadTheme()).toBe('escuro')
  })

  it('aplica e remove o atributo data-tema na raiz da página', () => {
    applyTheme('claro')
    expect(document.documentElement.dataset.tema).toBe('claro')
    applyTheme('escuro')
    expect(document.documentElement.dataset.tema).toBeUndefined()
  })

  it('acompanha a cor da barra do navegador no celular', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#080d19'
    document.head.appendChild(meta)

    applyTheme('claro')
    expect(meta.content).toBe('#f4f6fb')
    applyTheme('escuro')
    expect(meta.content).toBe('#080d19')

    meta.remove()
  })
})
