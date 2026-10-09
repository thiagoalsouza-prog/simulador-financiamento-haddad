import { X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Portal } from './ui/Portal'
import { cx } from './ui/cx'
import { useDialogA11y } from './ui/useDialogA11y'

interface ModalProps {
  open: boolean
  title: string
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

/** Diálogo centralizado (folha inferior no celular). Foco preso, Esc fecha, clique no fundo fecha. */
export function Modal({ open, title, description, onClose, children, maxWidthClassName = 'max-w-lg' }: ModalProps) {
  const titleId = useId()
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose)

  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        <div className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-[2px]" onMouseDown={onClose} aria-hidden="true" />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cx(
            'relative flex max-h-[92vh] w-full animate-pop flex-col overflow-hidden rounded-t-3xl border border-border bg-popover text-popover-foreground shadow-pop outline-none sm:rounded-2xl',
            maxWidthClassName,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold tracking-tight">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </div>
      </div>
    </Portal>
  )
}
