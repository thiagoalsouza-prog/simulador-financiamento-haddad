import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  ChevronDown,
  Gauge,
  Hourglass,
  Percent,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { formatPercent } from '../utils/numbers'
import { AmortizationTable } from './AmortizationTable'
import { RecoveryBanner } from './RecoveryBanner'
import { RecoveryChart } from './RecoveryChart'
import { Timeline } from './Timeline'
import { Alert } from './ui/Alert'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { StatCard } from './ui/StatCard'
import type { Tom } from './ui/tones'
import { cx } from './ui/cx'

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
  healthy: { box: 'border-success/30 bg-success-soft', text: 'text-success', Icon: ShieldCheck },
  moderate: { box: 'border-warning/30 bg-warning-soft', text: 'text-warning', Icon: ShieldQuestion },
  high: { box: 'border-danger/30 bg-danger-soft', text: 'text-danger', Icon: ShieldAlert },
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
    schedule,
  } = outcome

  // séries reais: recebido acumulado e resultado (recebido − custo) a cada parcela
  const { received, result } = useMemo(() => {
    const receivedSeries = [downPayment]
    let acc = downPayment
    for (const row of schedule) {
      acc += row.payment
      receivedSeries.push(acc)
    }
    return { received: receivedSeries, result: receivedSeries.map((value) => value - directCost) }
  }, [schedule, downPayment, directCost])

  const resultTone: Tom = managerialResult > 0 ? 'sucesso' : managerialResult < 0 ? 'critico' : 'neutro'
  const marginTone: Tom = marginPct > 0 ? 'sucesso' : marginPct < 0 ? 'critico' : 'neutro'
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

  const recoveryValue = !costRecovery.covered
    ? 'Não alcançada'
    : costRecovery.installment === 0
      ? 'Na entrada'
      : `${costRecovery.installment}ª parcela`

  return (
    <Card className="flex flex-col gap-6 p-5 sm:p-6">
      <CardHeader
        icon={Gauge}
        title="Área gerencial"
        description="Informações internas — não aparecem na proposta."
        action={
          <>
            <Button variant="outline" size="sm" onClick={onOpenRiskMessage}>
              <AlertTriangle aria-hidden />
              Mensagem de risco
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenPatients}>
              <Users aria-hidden />
              Pacientes salvos
            </Button>
          </>
        }
      />

      <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        <StatCard
          rotulo="Custo direto"
          valor={formatCurrency(directCost)}
          icone={Wallet}
          dica="Informação interna. Nunca aparece na proposta."
        />
        <StatCard
          rotulo="Parcela de recuperação do custo"
          valor={recoveryValue}
          icone={Target}
          tom={costRecovery.covered ? 'sucesso' : 'critico'}
          detalhe={costRecovery.covered && costRecovery.installment ? `de ${installmentsCount} parcelas` : undefined}
          dica="Primeira parcela em que entrada + parcelas recebidas passam a cobrir o custo direto."
        />
        <StatCard
          rotulo="Recebido acumulado na recuperação"
          valor={formatCurrency(costRecovery.receivedAtRecovery)}
          icone={Banknote}
          tom="primario"
          serie={received}
          rotuloSerie="Total recebido, acumulado desde a entrada"
        />
        <StatCard
          rotulo="Faltava receber depois da entrada"
          valor={formatCurrency(amountMissingAfterDownPayment)}
          icone={Hourglass}
          tom={amountMissingAfterDownPayment > 0 ? 'atencao' : 'sucesso'}
          dica="Parte do custo direto que a entrada não cobre."
        />
        <StatCard
          rotulo="Resultado da operação"
          valor={formatCurrency(managerialResult)}
          icone={managerialResult < 0 ? TrendingDown : TrendingUp}
          tom={resultTone}
          serie={result}
          rotuloSerie="Resultado acumulado: recebido menos custo, a cada parcela"
          dica="Total a receber menos o custo direto."
        />
        <StatCard
          rotulo="Margem sobre o total recebido"
          valor={formatPercent(marginPct, 1)}
          icone={Percent}
          tom={marginTone}
          dica="Resultado da operação dividido pelo total a receber."
        />
      </div>

      <Alert tone={managerialResult > 0 ? 'success' : managerialResult < 0 ? 'danger' : 'info'}>{resultText}</Alert>

      <div className="flex flex-col gap-4">
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
      </div>

      <section aria-labelledby="grafico-recuperacao">
        <h3 id="grafico-recuperacao" className="mb-3 text-sm font-semibold tracking-tight">
          Gráfico de recuperação
        </h3>
        <div className="rounded-xl border border-border bg-surface-2/40 p-3 sm:p-4">
          <RecoveryChart outcome={outcome} directCost={directCost} downPayment={downPayment} />
        </div>
      </section>

      <section aria-labelledby="linha-do-tempo">
        <h3 id="linha-do-tempo" className="mb-3 text-sm font-semibold tracking-tight">
          Linha do tempo
        </h3>
        <Timeline outcome={outcome} downPayment={downPayment} />
      </section>

      <div className={cx('rounded-xl border p-4', riskStyle.box)}>
        <div className={cx('flex items-center gap-2', riskStyle.text)}>
          <riskStyle.Icon className="size-[18px]" aria-hidden="true" />
          <span className="text-sm font-bold">{RISK_LABEL[risk.level]}</span>
          <Badge tom={risk.level === 'healthy' ? 'sucesso' : risk.level === 'moderate' ? 'atencao' : 'critico'} className="ml-auto">
            {risk.alerts.length === 0 ? 'Sem alertas' : `${risk.alerts.length} ${risk.alerts.length === 1 ? 'alerta' : 'alertas'}`}
          </Badge>
        </div>
        {risk.alerts.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {risk.alerts.map((alert) => (
              <li key={alert} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {alert}
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="group rounded-xl border border-border bg-surface-2/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent/60 [&::-webkit-details-marker]:hidden">
          Tabela de amortização completa
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="px-4 pb-4">
          <AmortizationTable
            schedule={schedule}
            costRecoveryInstallment={costRecovery.covered ? costRecovery.installment : null}
            principalRecoveryInstallment={principalRecovery.covered ? principalRecovery.installment : null}
          />
        </div>
      </details>
    </Card>
  )
}
