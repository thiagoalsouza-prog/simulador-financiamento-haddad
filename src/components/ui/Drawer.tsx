import { X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Portal } from './Portal'
import { cx } from './cx'
import { useDialogA11y } from './useDialogA11y'

interface DrawerProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Painel lateral de detalhes (direita). Mesmo comportamento acessível do Modal. */
export function Drawer({ open, title, description, onClose, children, footer, className }: DrawerProps) {
  const titleId = useId()
  const panelRef = useDialogA11y<HTMLDivElement>(open, onClose)

  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-[2px]" onMouseDown={onClose} aria-hidden="true" />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cx(
            'absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-right flex-col border-l border-border bg-popover text-popover-foreground shadow-pop outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-base font-semibold tracking-tight">
                {title}
              </h2>
              {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
            </div>
            <button
              type="button"
              aria-label="Fechar painel"
              onClick={onClose}
              className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2/50 px-5 py-4">{footer}</div>
          )}
        </div>
      </div>
    </Portal>
  )
}
