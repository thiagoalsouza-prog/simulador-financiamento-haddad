import { GitCompareArrows, Trash2 } from 'lucide-react'
import type { Scenario } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { formatInstallments, formatPercent } from '../utils/numbers'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { cx } from './ui/cx'

interface ScenarioComparisonProps {
  scenarios: Scenario[]
  onClear: () => void
}

const RISK_LABEL = {
  healthy: 'Saudável',
  moderate: 'Moderado',
  high: 'Elevado',
} as const

type Better = 'higher' | 'lower' | 'neutral'

export function ScenarioComparison({ scenarios, onClear }: ScenarioComparisonProps) {
  if (scenarios.length === 0) {
    return (
      <Card className="p-5 sm:p-6">
        <CardHeader icon={GitCompareArrows} title="Comparação de cenários" />
        <p className="mt-3 text-sm text-muted-foreground">
          Adicione até três cenários usando o botão "Comparar cenário" no resultado calculado.
        </p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <CardHeader
        icon={GitCompareArrows}
        title="Comparação de cenários"
        description={scenarios.length > 1 ? 'As variações são calculadas em relação ao Cenário 1.' : undefined}
        action={
          <Button variant="ghost" size="sm" onClick={onClear} className="hover:text-danger">
            <Trash2 aria-hidden />
            Limpar comparação
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="data-table w-full min-w-[440px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Métrica
              </th>
              {scenarios.map((scenario, index) => (
                <th key={scenario.id} scope="col" className="px-3 py-2.5 font-semibold text-foreground">
                  Cenário {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ScenarioRow
              label="Parcelas"
              scenarios={scenarios}
              render={(s) => formatInstallments(s.outcome.installmentsCount)}
              numeric={(s) => s.outcome.installmentsCount}
              delta="count"
            />
            <ScenarioRow
              label="Valor mensal"
              scenarios={scenarios}
              render={(s) => formatCurrency(s.outcome.installmentValue)}
              numeric={(s) => s.outcome.installmentValue}
            />
            <ScenarioRow
              label="Entrada"
              scenarios={scenarios}
              render={(s) => formatCurrency(s.params.downPayment)}
              numeric={(s) => s.params.downPayment}
            />
            <ScenarioRow
              label="Total recebido"
              scenarios={scenarios}
              render={(s) => formatCurrency(s.outcome.totalReceived)}
              numeric={(s) => s.outcome.totalReceived}
              better="higher"
            />
            <ScenarioRow
              label="Custo do crédito"
              scenarios={scenarios}
              render={(s) => formatCurrency(s.outcome.creditCost)}
              numeric={(s) => s.outcome.creditCost}
            />
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
              numeric={(s) => s.outcome.managerialResult}
              better="higher"
            />
            <ScenarioRow
              label="Margem"
              scenarios={scenarios}
              render={(s) => formatPercent(s.outcome.marginPct, 1)}
              numeric={(s) => s.outcome.marginPct}
              better="higher"
              delta="points"
            />
            <ScenarioRow label="Risco" scenarios={scenarios} render={(s) => RISK_LABEL[s.outcome.risk.level]} />
          </tbody>
        </table>
      </div>
    </Card>
  )
}

interface ScenarioRowProps {
  label: string
  scenarios: Scenario[]
  render: (scenario: Scenario) => string
  toneFor?: (scenario: Scenario) => 'success' | 'danger' | undefined
  /** número usado para mostrar a variação em relação ao Cenário 1 */
  numeric?: (scenario: Scenario) => number
  better?: Better
  /** percent: variação relativa · points: diferença em pontos percentuais · count: diferença simples */
  delta?: 'percent' | 'points' | 'count'
}

function formatDelta(diff: number, base: number, kind: 'percent' | 'points' | 'count'): string | null {
  if (diff === 0) return null
  const sign = diff > 0 ? '+' : '−'
  const abs = Math.abs(diff)
  if (kind === 'count') return `${sign}${abs}`
  if (kind === 'points') return `${sign}${abs.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.`
  if (base === 0) return null
  const pct = (abs / Math.abs(base)) * 100
  return `${sign}${pct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

function ScenarioRow({ label, scenarios, render, toneFor, numeric, better = 'neutral', delta = 'percent' }: ScenarioRowProps) {
  const base = numeric ? numeric(scenarios[0]) : 0

  return (
    <tr className="border-t border-border">
      <th scope="row" className="px-3 py-2.5 text-left font-medium text-muted-foreground">
        {label}
      </th>
      {scenarios.map((scenario, index) => {
        const tone = toneFor?.(scenario)
        const diff = numeric && index > 0 ? numeric(scenario) - base : 0
        const deltaText = numeric && index > 0 ? formatDelta(diff, base, delta) : null
        const improved = better === 'higher' ? diff > 0 : better === 'lower' ? diff < 0 : null

        return (
          <td
            key={scenario.id}
            className={cx(
              'num px-3 py-2.5 font-medium',
              tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-foreground',
            )}
          >
            {render(scenario)}
            {deltaText && (
              <span
                title="Variação em relação ao Cenário 1"
                className={cx(
                  'block text-[11px] font-semibold',
                  improved === null ? 'text-muted-foreground' : improved ? 'text-success' : 'text-danger',
                )}
              >
                {deltaText}
              </span>
            )}
          </td>
        )
      })}
    </tr>
  )
}
