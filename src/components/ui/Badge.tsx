// Selo de status com os tons do sistema (mesmo significado em todos os sistemas Haddad).
// Portado do design-system-haddad/react/Badge.tsx (mesma API).
import type { ReactNode } from 'react'
import { cx } from './cx'

export type TomSelo = 'neutro' | 'info' | 'sucesso' | 'atencao' | 'critico' | 'violeta' | 'ciano'

const TONS_SELO: Record<TomSelo, string> = {
  neutro: 'bg-muted text-muted-foreground border-border',
  info: 'bg-info-soft text-info border-info/25',
  sucesso: 'bg-success-soft text-success border-success/25',
  atencao: 'bg-warning-soft text-warning border-warning/25',
  critico: 'bg-danger-soft text-danger border-danger/25',
  violeta: 'bg-violet-soft text-violet border-violet/25',
  ciano: 'bg-cyan/10 text-cyan border-cyan/25',
}

export function Badge({
  tom = 'neutro',
  children,
  ponto,
  className,
}: {
  tom?: TomSelo
  children: ReactNode
  ponto?: boolean
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        TONS_SELO[tom],
        className,
      )}
    >
      {ponto && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
