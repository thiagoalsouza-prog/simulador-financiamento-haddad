import { Component, type ErrorInfo, type ReactNode } from 'react'

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
          <h1 className="font-heading text-lg font-bold text-text">Algo deu errado</h1>
          <p className="max-w-md text-sm text-muted">
            Ocorreu um erro inesperado e esta tela não pôde ser exibida. Nada foi corrompido no
            banco de dados — apenas recarregue a página para continuar.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-light"
          >
            Recarregar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
