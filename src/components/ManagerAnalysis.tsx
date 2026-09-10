import { AlertCircle, AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion, Users } from 'lucide-react'
import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { formatPercent } from '../utils/numbers'
import { AmortizationTable } from './AmortizationTable'
import { RecoveryBanner } from './RecoveryBanner'
import { RecoveryChart } from './RecoveryChart'
import { Timeline } from './Timeline'

interface ManagerAnalysisProps {
  outcome: SimulationOutcome
  directCost: number
  downPayment: number
  onOpenPatients: () => void
  onOpenRiskMessage: () => void
}

const RISK_LABEL = {
  healthy: 'Condição saudável',
  moderate: 'Risco moderado',
  high: 'Risco elevado',
} as const

const RISK_STYLE = {
  healthy: { bg: 'bg-[#e8f5f1]', text: 'text-success', border: 'border-success/30', Icon: ShieldCheck },
  moderate: { bg: 'bg-[#faf1de]', text: 'text-warning', border: 'border-warning/30', Icon: ShieldQuestion },
  high: { bg: 'bg-[#fbeaea]', text: 'text-danger', border: 'border-danger/30', Icon: ShieldAlert },
} as const

export function ManagerAnalysis({
  outcome,
  directCost,
  downPayment,
  onOpenPatients,
  onOpenRiskMessage,
}: ManagerAnalysisProps) {
  const {
    managerialResult,
    marginPct,
    risk,
    amountMissingAfterDownPayment,
    costRecovery,
    principalRecovery,
    principal,
    installmentsCount,
  } = outcome

  const resultTone = managerialResult > 0 ? 'success' : managerialResult < 0 ? 'danger' : 'muted'
  const resultText =
    managerialResult > 0
      ? `Nesse momento, o custo de ${formatCurrency(directCost)} está pago e ${formatCurrency(
          managerialResult,
        )} já ficou acima do custo.`
      : managerialResult < 0
        ? `Mesmo após ${installmentsCount} parcelas, a clínica permanece com prejuízo de ${formatCurrency(
            Math.abs(managerialResult),
          )}.`
        : `O total recebido cobre exatamente o custo direto de ${formatCurrency(directCost)}.`

  const riskStyle = RISK_STYLE[risk.level]

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
            Área gerencial
          </h2>
          <p className="mt-1 text-xs text-muted">Informações internas — não aparecem na proposta.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenRiskMessage}
            className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary"
          >
            <AlertTriangle size={14} />
            Mensagem de risco
          </button>
          <button
            type="button"
            onClick={onOpenPatients}
            className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary"
          >
            <Users size={14} />
            Pacientes salvos
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <dt className="text-xs text-muted">Custo direto</dt>
          <dd className="mt-1 font-heading text-base font-bold text-text">{formatCurrency(directCost)}</dd>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-xs text-muted">Parcela de recuperação do custo</dt>
          <dd className="mt-1 font-heading text-base font-bold text-text">
            {!costRecovery.covered
              ? 'Não alcançada'
              : costRecovery.installment === 0
                ? 'Na entrada'
                : `${costRecovery.installment}ª parcela`}
          </dd>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-xs text-muted">Recebido acumulado na recuperação</dt>
          <dd className="mt-1 font-heading text-base font-bold text-text">
            {formatCurrency(costRecovery.receivedAtRecovery)}
          </dd>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-xs text-muted">Faltava receber depois da entrada</dt>
          <dd className="mt-1 font-heading text-base font-bold text-text">
            {formatCurrency(amountMissingAfterDownPayment)}
          </dd>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-xs text-muted">Resultado da operação</dt>
          <dd
            className={`mt-1 font-heading text-base font-bold ${
              resultTone === 'success' ? 'text-success' : resultTone === 'danger' ? 'text-danger' : 'text-text'
            }`}
          >
            {formatCurrency(managerialResult)}
          </dd>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-xs text-muted">Margem sobre o total recebido</dt>
          <dd className="mt-1 font-heading text-base font-bold text-text">{formatPercent(marginPct, 1)}</dd>
        </div>
      </dl>

      <p className="text-sm text-muted">{resultText}</p>

      <RecoveryBanner
        recovery={costRecovery}
        target={directCost}
        downPayment={downPayment}
        label="Recuperação do custo"
        targetNoun="custo"
        targetNounUpper="CUSTO"
        notCoveredTitle="ATENÇÃO: OPERAÇÃO EM PREJUÍZO"
        notCoveredSubtitle="O RECEBIMENTO NÃO COBRE O CUSTO"
      />

      <RecoveryBanner
        recovery={principalRecovery}
        target={principal}
        downPayment={downPayment}
        label="Recuperação do valor principal"
        targetNoun="valor principal"
        targetNounUpper="VALOR PRINCIPAL"
        notCoveredTitle="ATENÇÃO: SALDO FINANCIADO NÃO RECUPERADO"
        notCoveredSubtitle="O RECEBIMENTO NÃO COBRE O VALOR PRINCIPAL"
      />

      <div>
        <h3 className="mb-3 font-heading text-sm font-bold text-text">Gráfico de recuperação</h3>
        <RecoveryChart outcome={outcome} directCost={directCost} downPayment={downPayment} />
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-bold text-text">Linha do tempo</h3>
        <Timeline outcome={outcome} downPayment={downPayment} />
      </div>

      <div className={`rounded-xl border p-4 ${riskStyle.bg} ${riskStyle.border}`}>
        <div className={`flex items-center gap-2 ${riskStyle.text}`}>
          <riskStyle.Icon size={18} aria-hidden="true" />
          <span className="font-heading text-sm font-bold">{RISK_LABEL[risk.level]}</span>
        </div>
        {risk.alerts.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 text-sm text-text">
            {risk.alerts.map((alert) => (
              <li key={alert} className="flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                {alert}
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer font-heading text-sm font-bold text-text">
          Tabela de amortização completa
        </summary>
        <div className="mt-4">
          <AmortizationTable schedule={outcome.schedule} />
        </div>
      </details>
    </div>
  )
}
