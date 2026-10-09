export interface BarItem {
  label: string
  value: number
  /** texto à direita (ex.: "3 · R$ 44.400,00") */
  detail?: string
}

/** Distribuição em barras horizontais, na mesma escala (a maior barra ocupa 100%). Só números reais. */
export function BarList({ items, color = 'var(--primary)' }: { items: BarItem[]; color?: string }) {
  const max = Math.max(...items.map((item) => item.value), 0)

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium">{item.label}</span>
            {item.detail && <span className="num shrink-0 text-muted-foreground">{item.detail}</span>}
          </div>
          <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: max > 0 ? `${(item.value / max) * 100}%` : '0%', background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
