import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from './cx'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<AlertTone, { box: string; icon: LucideIcon }> = {
  info: { box: 'border-info/30 bg-info-soft text-foreground [&>svg]:text-info', icon: Info },
  success: { box: 'border-success/30 bg-success-soft text-foreground [&>svg]:text-success', icon: CheckCircle2 },
  warning: { box: 'border-warning/30 bg-warning-soft text-foreground [&>svg]:text-warning', icon: AlertTriangle },
  danger: { box: 'border-danger/30 bg-danger-soft text-foreground [&>svg]:text-danger', icon: XCircle },
}

/** Aviso em linha (mensagens de erro, resultado, observações). Use role="alert" só para erros que precisam ser lidos na hora. */
export function Alert({
  tone = 'info',
  title,
  children,
  className,
  role,
}: {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  className?: string
  role?: 'alert' | 'status'
}) {
  const { box, icon: Icon } = TONES[tone]
  return (
    <div role={role} className={cx('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(!!title && 'mt-0.5 text-muted-foreground')}>{children}</div>}
      </div>
    </div>
  )
}
