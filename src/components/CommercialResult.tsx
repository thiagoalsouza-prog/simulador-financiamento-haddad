import { Banknote, Calculator, CheckCircle2, Circle, FileText, GitCompareArrows, Landmark, Percent, Receipt } from 'lucide-react'
import { useMemo } from 'react'
import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { formatInstallments, formatPercent } from '../utils/numbers'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { StackedBar } from './ui/StackedBar'
import { StatCard } from './ui/StatCard'

export interface ReadinessStep {
  label: string
  done: boolean
}

interface CommercialResultProps {
  outcome: SimulationOutcome
  downPayment: number
  canCompute: boolean
  blockedMessage?: string
  /** passos que liberam o cálculo (nome e telefone, paciente salvo, tratamento) */
  steps?: ReadinessStep[]
  onGenerateProposal: () => void
  onCompareScenario: () => void
}

/** Séries reais da tabela de amortização, usadas nos mini gráficos dos cartões. */
function buildSeries(outcome: SimulationOutcome, downPayment: number) {
  let payments = 0
  let interest = 0
  const balance = [outcome.principal]
  const paid: number[] = []
  const interestPaid: number[] = []
  const received = [downPayment]
  for (const row of outcome.schedule) {
    payments += row.payment
    interest += row.interest
    balance.push(row.balance)
    paid.push(payments)
    interestPaid.push(interest)
    received.push(downPayment + payments)
  }
  return { balance, paid, interestPaid, received }
}

export function CommercialResult({
  outcome,
  downPayment,
  canCompute,
  blockedMessage,
  steps,
  onGenerateProposal,
  onCompareScenario,
}: CommercialResultProps) {
  const ready = canCompute && outcome.feasible
  const series = useMemo(() => buildSeries(outcome, downPayment), [outcome, downPayment])

  return (
    <Card glow className="p-5 sm:p-6">
      <CardHeader
        icon={Calculator}
        title="Condição calculada"
        description="Valores que serão apresentados ao paciente."
        action={
          ready ? (
            <Badge tom="sucesso" ponto>
              Pronta para a proposta
            </Badge>
          ) : (
            <Badge tom="atencao" ponto>
              Aguardando dados
            </Badge>
          )
        }
      />

      {!ready ? (
        <div className="mt-4 rounded-xl border border-dashed border-input bg-surface-2/50 p-5">
          <p role="status" className="text-sm text-muted-foreground">
            {outcome.infeasibleMessage ??
              blockedMessage ??
              'Preencha os dados do tratamento para calcular a condição de pagamento.'}
          </p>
          {steps && steps.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {steps.map((step) => (
                <li key={step.label} className="flex items-center gap-2 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
                  <span className="sr-only">{step.done ? ' — concluído' : ' — pendente'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/5 to-cyan/10 p-5">
            <p className="eyebrow">Condição de pagamento</p>
            <p
              key={`${outcome.installmentsCount}-${outcome.installmentValue}`}
              className="num value-in mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {formatInstallments(outcome.installmentsCount)} {formatCurrency(outcome.installmentValue)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">com entrada de {formatCurrency(downPayment)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tom="info">Juros {formatPercent(outcome.monthlyRate * 100, 2)} ao mês</Badge>
              <Badge tom="ciano">Entrada de {formatPercent(outcome.downPaymentPct, 1)} do tratamento</Badge>
            </div>
          </div>

          <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard
              rotulo="Saldo financiado"
              valor={formatCurrency(outcome.principal)}
              icone={Landmark}
              tom="primario"
              dica="Valor do tratamento menos a entrada: é o valor que será parcelado."
              serie={series.balance}
              rotuloSerie="Saldo devedor a cada parcela"
            />
            <StatCard
              rotulo="Total das parcelas"
              valor={formatCurrency(outcome.totalInstallments)}
              icone={Receipt}
              tom="ciano"
              dica="Soma de todas as parcelas, sem contar a entrada."
              serie={series.paid}
              rotuloSerie="Total pago em parcelas, acumulado"
            />
            <StatCard
              rotulo="Total a receber"
              valor={formatCurrency(outcome.totalReceived)}
              icone={Banknote}
              tom="sucesso"
              dica="Entrada mais todas as parcelas."
              serie={series.received}
              rotuloSerie="Total recebido, acumulado desde a entrada"
            />
            <StatCard
              rotulo="Custo do crédito"
              valor={formatCurrency(outcome.creditCost)}
              icone={Percent}
              tom="atencao"
              dica="Juros totais: total das parcelas menos o saldo financiado."
              serie={series.interestPaid}
              rotuloSerie="Juros pagos, acumulados"
            />
          </div>

          <section aria-labelledby="composicao-total" className="rounded-xl border border-border bg-surface-2/40 p-4">
            <h3 id="composicao-total" className="eyebrow mb-3">
              Composição do total a receber
            </h3>
            <StackedBar
              ariaLabel="Composição do total a receber"
              segments={[
                { label: 'Entrada', value: downPayment, color: 'var(--cyan)', display: formatCurrency(downPayment) },
                { label: 'Principal financiado', value: outcome.principal, color: 'var(--primary)', display: formatCurrency(outcome.principal) },
                { label: 'Juros do financiamento', value: outcome.creditCost, color: 'var(--warning)', display: formatCurrency(outcome.creditCost) },
              ]}
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={onGenerateProposal}>
              <FileText aria-hidden />
              Gerar proposta
            </Button>
            <Button size="lg" variant="outline" onClick={onCompareScenario}>
              <GitCompareArrows aria-hidden />
              Comparar cenário
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
