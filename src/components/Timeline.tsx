import { Calendar, ChevronRight, Flag, TrendingUp } from 'lucide-react'
import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'

interface TimelineProps {
  outcome: SimulationOutcome
  downPayment: number
}

export function Timeline({ outcome, downPayment }: TimelineProps) {
  const { costRecovery, totalReceived, installmentsCount } = outcome

  let recoveryTitle: string
  let recoverySubtitle: string

  if (!costRecovery.covered) {
    recoveryTitle = 'Não alcançado'
    recoverySubtitle = 'Custo não recuperado'
  } else if (costRecovery.installment === 0) {
    recoveryTitle = 'Na entrada'
    recoverySubtitle = 'Custo totalmente pago'
  } else {
    recoveryTitle = `${costRecovery.installment}ª parcela`
    recoverySubtitle = 'Custo totalmente pago'
  }

  const steps = [
    {
      icon: Calendar,
      label: 'Hoje',
      title: formatCurrency(downPayment),
      subtitle: 'Entrada',
      tile: 'bg-primary/15 text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Recuperação do custo',
      title: recoveryTitle,
      subtitle: recoverySubtitle,
      tile: costRecovery.covered ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
    },
    {
      icon: Flag,
      label: 'Final do plano',
      title: `${installmentsCount}ª parcela`,
      subtitle: `Total recebido: ${formatCurrency(totalReceived)}`,
      tile: 'bg-cyan/15 text-cyan',
    },
  ]

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.label} className="relative rounded-xl border border-border bg-surface-2/60 p-4">
          <div className="flex items-center gap-2.5">
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${step.tile}`}>
              <step.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="eyebrow">{step.label}</span>
          </div>
          <p className="num mt-3 text-base font-semibold">{step.title}</p>
          <p className="num text-xs text-muted-foreground">{step.subtitle}</p>
          {index < steps.length - 1 && (
            <ChevronRight
              className="absolute -right-[11px] top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full border border-border bg-card p-0.5 text-muted-foreground sm:block"
              aria-hidden="true"
            />
          )}
        </li>
      ))}
    </ol>
  )
}
