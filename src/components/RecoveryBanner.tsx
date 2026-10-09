import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { CostRecoveryResult } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { cx } from './ui/cx'

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

/** Barra fina que mostra quanto do valor-alvo já foi recebido (100% quando coberto). */
function CoverageBar({ pct, tone, label }: { pct: number; tone: 'success' | 'danger'; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-1.5 overflow-hidden rounded-full bg-foreground/10"
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-300', tone === 'success' ? 'bg-success' : 'bg-danger')}
        style={{ width: `${value}%` }}
      />
    </div>
  )
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
        className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-success/30 bg-success-soft p-5 pl-6 sm:p-6 sm:pl-7"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-success" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wide text-success">{label}</span>
        </div>

        <p className="text-lg font-extrabold leading-snug tracking-tight sm:text-xl">
          {isFromDownPaymentAlone
            ? `O ${targetNounUpper} JÁ É COBERTO PELA ENTRADA`
            : `O ${targetNounUpper} SERÁ COBERTO NA ${recovery.installment}ª PARCELA`}
        </p>

        <p className="num text-sm text-muted-foreground">
          {isFromDownPaymentAlone
            ? `Entrada de ${formatCurrency(downPayment)} já cobre o ${targetNoun} de ${formatCurrency(target)}.`
            : `Entrada + parcelas somam ${formatCurrency(recovery.receivedAtRecovery)}`}
        </p>

        {amountMissingAfterDownPayment > 0 && (
          <p className="num text-sm text-muted-foreground">
            Falta receber nas parcelas:{' '}
            <strong className="font-semibold text-foreground">{formatCurrency(amountMissingAfterDownPayment)}</strong>
          </p>
        )}

        <CoverageBar pct={100} tone="success" label={`${label}: 100% coberto`} />
      </div>
    )
  }

  const stillMissing = Math.max(0, target - recovery.receivedAtRecovery)
  const coveredPct = target > 0 ? (recovery.receivedAtRecovery / target) * 100 : 0

  return (
    <div
      role="status"
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-danger/30 bg-danger-soft p-5 pl-6 sm:p-6 sm:pl-7"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-danger" />
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-danger" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wide text-danger">{label}</span>
      </div>

      <p className="text-lg font-extrabold leading-snug tracking-tight sm:text-xl">{notCoveredTitle}</p>
      <p className="text-base font-bold">{notCoveredSubtitle}</p>

      <p className="num text-sm text-muted-foreground">
        Entrada + todas as parcelas somam {formatCurrency(recovery.receivedAtRecovery)}. Ainda faltará{' '}
        <strong className="font-semibold text-foreground">{formatCurrency(stillMissing)}</strong> após a última
        parcela.
      </p>

      <CoverageBar pct={coveredPct} tone="danger" label={`${label}: ${Math.round(coveredPct)}% coberto`} />
    </div>
  )
}
