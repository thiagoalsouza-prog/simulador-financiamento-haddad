import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { CostRecoveryResult } from '../finance/types'
import { formatCurrency } from '../utils/currency'

interface RecoveryBannerProps {
  recovery: CostRecoveryResult
  target: number
  downPayment: number
  label: string
  targetNoun: string
  targetNounUpper: string
  notCoveredTitle: string
  notCoveredSubtitle: string
}

/**
 * Painel de recuperação nominal de um valor-alvo (custo direto ou saldo
 * financiado) a partir de entrada + parcelas efetivamente recebidas.
 */
export function RecoveryBanner({
  recovery,
  target,
  downPayment,
  label,
  targetNoun,
  targetNounUpper,
  notCoveredTitle,
  notCoveredSubtitle,
}: RecoveryBannerProps) {
  const amountMissingAfterDownPayment = Math.max(0, target - downPayment)

  if (recovery.covered) {
    const isFromDownPaymentAlone = recovery.installment === 0

    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-[#e8f5f1] p-5 text-[#0a4a3f] sm:p-6"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-success" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wide text-success">{label}</span>
        </div>

        <p className="font-heading text-lg font-extrabold leading-snug sm:text-xl">
          {isFromDownPaymentAlone
            ? `O ${targetNounUpper} JÁ É COBERTO PELA ENTRADA`
            : `O ${targetNounUpper} SERÁ COBERTO NA ${recovery.installment}ª PARCELA`}
        </p>

        <p className="text-sm">
          {isFromDownPaymentAlone
            ? `Entrada de ${formatCurrency(downPayment)} já cobre o ${targetNoun} de ${formatCurrency(target)}.`
            : `Entrada + parcelas somam ${formatCurrency(recovery.receivedAtRecovery)}`}
        </p>

        {amountMissingAfterDownPayment > 0 && (
          <p className="text-sm">
            Falta receber nas parcelas: <strong>{formatCurrency(amountMissingAfterDownPayment)}</strong>
          </p>
        )}
      </div>
    )
  }

  const stillMissing = Math.max(0, target - recovery.receivedAtRecovery)

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-[#fbeaea] p-5 text-[#7a2323] sm:p-6"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} className="text-danger" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wide text-danger">{label}</span>
      </div>

      <p className="font-heading text-lg font-extrabold leading-snug sm:text-xl">{notCoveredTitle}</p>
      <p className="font-heading text-base font-bold">{notCoveredSubtitle}</p>

      <p className="text-sm">
        Entrada + todas as parcelas somam {formatCurrency(recovery.receivedAtRecovery)}. Ainda faltará{' '}
        <strong>{formatCurrency(stillMissing)}</strong> após a última parcela.
      </p>
    </div>
  )
}
