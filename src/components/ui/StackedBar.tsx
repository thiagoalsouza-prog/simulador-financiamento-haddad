import { formatPercent } from '../../utils/numbers'

export interface StackedSegment {
  label: string
  value: number
  /** cor CSS, de preferência uma variável do tema: var(--primary) */
  color: string
  /** texto já formatado do valor (ex.: R$ 2.500,00) */
  display: string
}

/**
 * Barra de composição: mostra de que partes um total é feito. Só números reais; segmentos zerados somem da barra
 * (mas continuam na legenda) e a soma das partes define os 100%.
 */
export function StackedBar({ segments, ariaLabel }: { segments: StackedSegment[]; ariaLabel: string }) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0)
  const share = (value: number) => (total > 0 ? (Math.max(0, value) / total) * 100 : 0)

  const summary = segments.map((segment) => `${segment.label} ${segment.display} (${formatPercent(share(segment.value), 0)})`).join(', ')

  return (
    <div>
      <div role="img" aria-label={`${ariaLabel}: ${summary}`} className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-surface-3">
        {segments.map(
          (segment) =>
            share(segment.value) > 0 && (
              <span
                key={segment.label}
                className="h-full transition-[width] duration-300"
                style={{ width: `${share(segment.value)}%`, background: segment.color }}
              />
            ),
        )}
      </div>

      <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-start gap-2 text-xs">
            <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full" style={{ background: segment.color }} />
            <div className="min-w-0">
              <p className="text-muted-foreground">{segment.label}</p>
              <p className="num font-semibold text-foreground">
                {segment.display} <span className="font-normal text-muted-foreground">· {formatPercent(share(segment.value), 0)}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
