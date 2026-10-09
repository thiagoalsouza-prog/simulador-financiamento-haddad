import { AlertCircle } from 'lucide-react'
import { type ReactNode, useId } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode
}

export function FormField({ label, error, hint, children }: FormFieldProps) {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      {children({ inputId, describedBy })}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 flex items-start gap-1 text-xs font-medium text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}
