import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'

interface CostRecoveryBannerProps {
  outcome: SimulationOutcome
  directCost: number
  downPayment: number
}

export function CostRecoveryBanner({ outcome, directCost, downPayment }: CostRecoveryBannerProps) {
  const { costRecovery, amountMissingAfterDownPayment } = outcome

  if (costRecovery.covered) {
    const isFromDownPaymentAlone = costRecovery.installment === 0

    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-[#e8f5f1] p-5 text-[#0a4a3f] sm:p-6"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-success" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wide text-success">
            Recuperação do custo
          </span>
        </div>

        <p className="font-heading text-lg font-extrabold leading-snug sm:text-xl">
          {isFromDownPaymentAlone
            ? 'O CUSTO JÁ É COBERTO PELA ENTRADA'
            : `O CUSTO SERÁ COBERTO NA ${costRecovery.installment}ª PARCELA`}
        </p>

        <p className="text-sm">
          {isFromDownPaymentAlone
            ? `Entrada de ${formatCurrency(downPayment)} já cobre o custo de ${formatCurrency(directCost)}.`
            : `Entrada + parcelas somam ${formatCurrency(costRecovery.receivedAtRecovery)}`}
        </p>

        {amountMissingAfterDownPayment > 0 && (
          <p className="text-sm">
            Falta receber nas parcelas: <strong>{formatCurrency(amountMissingAfterDownPayment)}</strong>
          </p>
        )}
      </div>
    )
  }

  const stillMissing = Math.max(0, directCost - costRecovery.receivedAtRecovery)

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-[#fbeaea] p-5 text-[#7a2323] sm:p-6"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} className="text-danger" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wide text-danger">
          Recuperação do custo
        </span>
      </div>

      <p className="font-heading text-lg font-extrabold leading-snug sm:text-xl">
        ATENÇÃO: OPERAÇÃO EM PREJUÍZO
      </p>
      <p className="font-heading text-base font-bold">O RECEBIMENTO NÃO COBRE O CUSTO</p>

      <p className="text-sm">
        Entrada + todas as parcelas somam {formatCurrency(costRecovery.receivedAtRecovery)}. Ainda
        faltará <strong>{formatCurrency(stillMissing)}</strong> após a última parcela.
      </p>
    </div>
  )
}
