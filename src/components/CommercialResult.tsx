import { FileText, GitCompareArrows } from 'lucide-react'
import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { formatInstallments } from '../utils/numbers'

interface CommercialResultProps {
  outcome: SimulationOutcome
  downPayment: number
  canCompute: boolean
  blockedMessage?: string
  onGenerateProposal: () => void
  onCompareScenario: () => void
}

export function CommercialResult({
  outcome,
  downPayment,
  canCompute,
  blockedMessage,
  onGenerateProposal,
  onCompareScenario,
}: CommercialResultProps) {
  const ready = canCompute && outcome.feasible

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
        Condição calculada
      </h2>

      {!ready ? (
        <p role="status" className="rounded-xl bg-background p-4 text-sm text-muted">
          {outcome.infeasibleMessage ??
            blockedMessage ??
            'Preencha os dados do tratamento para calcular a condição de pagamento.'}
        </p>
      ) : (
        <>
          <div className="rounded-xl bg-background p-5">
            <p className="font-heading text-2xl font-extrabold text-primary sm:text-3xl">
              {formatInstallments(outcome.installmentsCount)} {formatCurrency(outcome.installmentValue)}
            </p>
            <p className="mt-1 text-sm text-muted">com entrada de {formatCurrency(downPayment)}</p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted">Saldo financiado</dt>
              <dd className="mt-1 font-heading text-base font-bold text-text">
                {formatCurrency(outcome.principal)}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted">Total das parcelas</dt>
              <dd className="mt-1 font-heading text-base font-bold text-text">
                {formatCurrency(outcome.totalInstallments)}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted">Total a receber</dt>
              <dd className="mt-1 font-heading text-base font-bold text-text">
                {formatCurrency(outcome.totalReceived)}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted">Custo do crédito</dt>
              <dd className="mt-1 font-heading text-base font-bold text-text">
                {formatCurrency(outcome.creditCost)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onGenerateProposal}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-light"
            >
              <FileText size={16} />
              Gerar proposta
            </button>
            <button
              type="button"
              onClick={onCompareScenario}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
            >
              <GitCompareArrows size={16} />
              Comparar cenário
            </button>
          </div>
        </>
      )}
    </div>
  )
}
