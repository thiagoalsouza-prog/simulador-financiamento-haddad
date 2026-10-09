import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastInput {
  tone?: ToastTone
  title: string
  description?: string
  /** milissegundos; padrão 4 s (erros ficam 7 s) */
  duration?: number
}

export interface ToastApi {
  push: (toast: ToastInput) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

const NOOP: ToastApi = { push: () => {}, dismiss: () => {} }

/** Sem o provider (testes de componentes isolados) as notificações simplesmente não aparecem. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP
}
