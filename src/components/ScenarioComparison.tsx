import { Trash2 } from 'lucide-react'
import type { Scenario } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { formatInstallments, formatPercent } from '../utils/numbers'

interface ScenarioComparisonProps {
  scenarios: Scenario[]
  onClear: () => void
}

const RISK_LABEL = {
  healthy: 'Saudável',
  moderate: 'Moderado',
  high: 'Elevado',
} as const

export function ScenarioComparison({ scenarios, onClear }: ScenarioComparisonProps) {
  if (scenarios.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
          Comparação de cenários
        </h2>
        <p className="mt-3 text-sm text-muted">
          Adicione até três cenários usando o botão "Comparar cenário" no resultado calculado.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
          Comparação de cenários
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-background hover:text-danger"
        >
          <Trash2 size={14} />
          Limpar comparação
        </button>
      </div>

      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2 font-semibold">
                Métrica
              </th>
              {scenarios.map((scenario, index) => (
                <th key={scenario.id} scope="col" className="px-3 py-2 font-semibold text-text">
                  Cenário {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ScenarioRow label="Parcelas" scenarios={scenarios} render={(s) => formatInstallments(s.outcome.installmentsCount)} />
            <ScenarioRow label="Valor mensal" scenarios={scenarios} render={(s) => formatCurrency(s.outcome.installmentValue)} />
            <ScenarioRow label="Entrada" scenarios={scenarios} render={(s) => formatCurrency(s.params.downPayment)} />
            <ScenarioRow label="Total recebido" scenarios={scenarios} render={(s) => formatCurrency(s.outcome.totalReceived)} />
            <ScenarioRow label="Custo do crédito" scenarios={scenarios} render={(s) => formatCurrency(s.outcome.creditCost)} />

            <ScenarioRow
              label="Recuperação do custo"
              scenarios={scenarios}
              render={(s) =>
                !s.outcome.costRecovery.covered
                  ? 'Não alcançada'
                  : s.outcome.costRecovery.installment === 0
                    ? 'Na entrada'
                    : `${s.outcome.costRecovery.installment}ª parcela`
              }
            />
            <ScenarioRow
              label="Resultado"
              scenarios={scenarios}
              render={(s) => formatCurrency(s.outcome.managerialResult)}
              toneFor={(s) => (s.outcome.managerialResult > 0 ? 'success' : s.outcome.managerialResult < 0 ? 'danger' : undefined)}
            />
            <ScenarioRow label="Margem" scenarios={scenarios} render={(s) => formatPercent(s.outcome.marginPct, 1)} />
            <ScenarioRow label="Risco" scenarios={scenarios} render={(s) => RISK_LABEL[s.outcome.risk.level]} />
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ScenarioRowProps {
  label: string
  scenarios: Scenario[]
  render: (scenario: Scenario) => string
  toneFor?: (scenario: Scenario) => 'success' | 'danger' | undefined
}

function ScenarioRow({ label, scenarios, render, toneFor }: ScenarioRowProps) {
  return (
    <tr className="border-t border-border">
      <th scope="row" className="px-3 py-2.5 text-left font-medium text-muted">
        {label}
      </th>
      {scenarios.map((scenario) => {
        const tone = toneFor?.(scenario)
        return (
          <td
            key={scenario.id}
            className={`px-3 py-2.5 font-medium ${
              tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-text'
            }`}
          >
            {render(scenario)}
          </td>
        )
      })}
    </tr>
  )
}
