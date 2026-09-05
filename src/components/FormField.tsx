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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
      </label>
      {children({ inputId, describedBy })}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
