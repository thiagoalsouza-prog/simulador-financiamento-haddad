import { useEffect, useRef, useState } from 'react'
import { parsePercentInput } from '../utils/numbers'

interface PercentInputProps {
  id: string
  value: number
  onChange: (value: number) => void
  describedBy?: string
  invalid?: boolean
}

function formatForEdit(value: number): string {
  if (!Number.isFinite(value)) return ''
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 4 })
}

export function PercentInput({ id, value, onChange, describedBy, invalid }: PercentInputProps) {
  const [text, setText] = useState(() => formatForEdit(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) {
      setText(formatForEdit(value))
    }
  }, [value])

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={`w-full min-h-11 rounded-xl border bg-surface py-2.5 pl-3 pr-9 text-sm text-text shadow-soft outline-none transition focus:border-primary ${
          invalid ? 'border-danger' : 'border-border'
        }`}
        onFocus={() => {
          focused.current = true
        }}
        onChange={(e) => {
          setText(e.target.value)
          onChange(parsePercentInput(e.target.value))
        }}
        onBlur={() => {
          focused.current = false
          const parsed = parsePercentInput(text)
          setText(formatForEdit(parsed))
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">%</span>
    </div>
  )
}
