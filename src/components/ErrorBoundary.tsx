import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Barreira de erro de última instância. Sem isso, uma exceção de render em
 * qualquer componente derruba a árvore inteira e deixa a tela em branco.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado na aplicação:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger">
            <TriangleAlert className="size-7" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Algo deu errado</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Ocorreu um erro inesperado e esta tela não pôde ser exibida. Nada foi corrompido no
            banco de dados — apenas recarregue a página para continuar.
          </p>
          <Button size="lg" onClick={this.handleReload}>
            <RefreshCw aria-hidden />
            Recarregar página
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
