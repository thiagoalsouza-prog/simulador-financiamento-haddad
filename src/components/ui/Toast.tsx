import { AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from './cx'
import { ToastContext, type ToastInput, type ToastTone } from './useToast'

interface ToastItem extends ToastInput {
  id: number
  tone: ToastTone
}

const TONES: Record<ToastTone, { icon: LucideIcon; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-success' },
  error: { icon: AlertTriangle, color: 'text-danger' },
  info: { icon: Info, color: 'text-info' },
}

/** Notificações discretas no topo da tela (feedback de ações: salvar, copiar, erros). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++
      const tone = toast.tone ?? 'info'
      setItems((current) => [...current.slice(-3), { ...toast, id, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), toast.duration ?? (tone === 'error' ? 7000 : 4000)),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const active = timers.current
    return () => {
      active.forEach((timer) => clearTimeout(timer))
      active.clear()
    }
  }, [])

  const api = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Notificações"
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => {
          const { icon: Icon, color } = TONES[item.tone]
          return (
            <div
              key={item.id}
              role={item.tone === 'error' ? 'alert' : 'status'}
              className="card-surface pointer-events-auto flex w-full max-w-sm animate-toast items-start gap-3 rounded-xl bg-popover px-4 py-3 text-sm shadow-pop"
            >
              <Icon className={cx('mt-0.5 size-4 shrink-0', color)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
              </div>
              <button
                type="button"
                aria-label="Fechar notificação"
                onClick={() => dismiss(item.id)}
                className="-mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
