import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

/** Superfície padrão de cartão (borda, brilho superior e sombra profunda do design system). */
export function Card({
  className,
  glow,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /** fio luminoso no topo, para cartões em destaque */
  glow?: boolean
}) {
  return <div className={cx('card-surface rounded-2xl', glow && 'brilho-topo', className)} {...props} />
}

/** Cabeçalho de seção dentro de um cartão: ícone, título, descrição curta e uma ação à direita. */
export function CardHeader({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-wrap items-start justify-between gap-x-3 gap-y-2', className)}>
      <div className="flex min-w-[min(100%,13rem)] flex-1 items-start gap-3">
        {Icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-cyan">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-8 tracking-tight">{title}</h2>
          {description && <p className="-mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
