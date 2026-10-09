import type { ReactNode } from 'react'

/** Anel de progresso (0–100) em SVG puro; o conteúdo é desenhado no centro. */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  color = 'var(--primary)',
  label,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  label: string
  children?: ReactNode
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0

  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 300ms var(--ease-out)' }}
        />
      </svg>
      {children && <div className="num absolute inset-0 grid place-items-center text-xs font-semibold">{children}</div>}
    </div>
  )
}
