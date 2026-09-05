import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

export function Modal({ open, title, onClose, children, maxWidthClassName = 'max-w-lg' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1a17]/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`w-full ${maxWidthClassName} max-h-[90vh] overflow-y-auto rounded-2xl bg-surface p-6 shadow-soft_lg`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="font-heading text-lg font-bold text-text">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted transition hover:bg-background hover:text-text"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
