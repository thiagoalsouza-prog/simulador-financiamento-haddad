import { useEffect, useRef, useState } from 'react'
import { formatNumberForEdit, parseCurrencyInput } from '../utils/currency'

interface MoneyInputProps {
  id: string
  value: number
  onChange: (value: number) => void
  describedBy?: string
  invalid?: boolean
  placeholder?: string
}

export function MoneyInput({ id, value, onChange, describedBy, invalid, placeholder }: MoneyInputProps) {
  const [text, setText] = useState(() => (value ? formatNumberForEdit(value) : ''))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) {
      setText(value ? formatNumberForEdit(value) : '')
    }
  }, [value])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={`w-full min-h-11 rounded-xl border bg-surface py-2.5 pl-10 pr-3 text-sm text-text shadow-soft outline-none transition focus:border-primary ${
          invalid ? 'border-danger' : 'border-border'
        }`}
        onFocus={() => {
          focused.current = true
        }}
        onChange={(e) => {
          setText(e.target.value)
          onChange(parseCurrencyInput(e.target.value))
        }}
        onBlur={() => {
          focused.current = false
          const parsed = parseCurrencyInput(text)
          setText(parsed ? formatNumberForEdit(parsed) : '')
        }}
      />
    </div>
  )
}
