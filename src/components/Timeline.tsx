import { Calendar, Flag, TrendingUp } from 'lucide-react'
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
    },
    {
      icon: TrendingUp,
      label: 'Recuperação do custo',
      title: recoveryTitle,
      subtitle: recoverySubtitle,
    },
    {
      icon: Flag,
      label: 'Final do plano',
      title: `${installmentsCount}ª parcela`,
      subtitle: `Total recebido: ${formatCurrency(totalReceived)}`,
    },
  ]

  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {steps.map((step) => (
        <li key={step.label} className="rounded-xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <step.icon size={16} aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wide">{step.label}</span>
          </div>
          <p className="font-heading text-base font-bold text-text">{step.title}</p>
          <p className="text-xs text-muted">{step.subtitle}</p>
        </li>
      ))}
    </ol>
  )
}
