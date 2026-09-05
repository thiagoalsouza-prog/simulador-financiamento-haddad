import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'

interface RecoveryChartProps {
  outcome: SimulationOutcome
  directCost: number
  downPayment: number
}

const WIDTH = 640
const HEIGHT = 280
const PAD_LEFT = 16
const PAD_RIGHT = 16
const PAD_TOP = 28
const PAD_BOTTOM = 32

export function RecoveryChart({ outcome, directCost, downPayment }: RecoveryChartProps) {
  const { schedule, costRecovery } = outcome

  const cumulative: number[] = [downPayment]
  let acc = downPayment
  for (const row of schedule) {
    acc += row.payment
    cumulative.push(acc)
  }

  const maxValue = Math.max(...cumulative, directCost) * 1.08 || 1
  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const n = cumulative.length - 1

  const xFor = (index: number) => PAD_LEFT + (n === 0 ? 0 : (index / n) * innerWidth)
  const yFor = (value: number) => PAD_TOP + innerHeight - (value / maxValue) * innerHeight

  const linePoints = cumulative.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ')
  const areaPoints = `${xFor(0)},${yFor(0)} ${linePoints} ${xFor(n)},${yFor(0)}`

  const costY = yFor(directCost)
  const recoveryIndex = costRecovery.covered ? costRecovery.installment ?? 0 : null
  const recoveryX = recoveryIndex !== null ? xFor(recoveryIndex) : null
  const recoveryY = recoveryIndex !== null ? yFor(cumulative[recoveryIndex]) : null

  const description = costRecovery.covered
    ? `Gráfico mostrando o recebimento acumulado desde a entrada até a última parcela. O custo de ${formatCurrency(
        directCost,
      )} é atingido na ${costRecovery.installment === 0 ? 'entrada' : `${costRecovery.installment}ª parcela`}.`
    : `Gráfico mostrando o recebimento acumulado desde a entrada até a última parcela. O custo de ${formatCurrency(
        directCost,
      )} não é atingido dentro do prazo simulado.`

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby="recovery-chart-title recovery-chart-desc"
        className="w-full"
      >
        <title id="recovery-chart-title">Recuperação do custo ao longo das parcelas</title>
        <desc id="recovery-chart-desc">{description}</desc>

        <defs>
          <linearGradient id="recoveryFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-light)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary-light)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={PAD_LEFT}
          y1={costY}
          x2={WIDTH - PAD_RIGHT}
          y2={costY}
          stroke="var(--danger)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
        <text x={WIDTH - PAD_RIGHT} y={costY - 6} textAnchor="end" fontSize="11" fill="var(--danger)">
          Custo: {formatCurrency(directCost)}
        </text>

        <polygon points={areaPoints} fill="url(#recoveryFill)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {cumulative.map((value, index) => (
          <circle key={index} cx={xFor(index)} cy={yFor(value)} r={2.5} fill="var(--primary)" />
        ))}

        {recoveryX !== null && recoveryY !== null && (
          <g>
            <circle cx={recoveryX} cy={recoveryY} r={6} fill="var(--surface)" stroke="var(--success)" strokeWidth={3} />
            <text
              x={Math.min(Math.max(recoveryX, PAD_LEFT + 40), WIDTH - PAD_RIGHT - 40)}
              y={Math.max(recoveryY - 14, 14)}
              textAnchor="middle"
              fontSize="11"
              fontWeight={700}
              fill="var(--success)"
            >
              {recoveryIndex === 0 ? 'ENTRADA' : `${recoveryIndex}ª PARCELA`}
            </text>
          </g>
        )}

        <line
          x1={PAD_LEFT}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_RIGHT}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="var(--border)"
        />
        <text x={PAD_LEFT} y={HEIGHT - 8} fontSize="11" fill="var(--muted)">
          Entrada
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 8} textAnchor="end" fontSize="11" fill="var(--muted)">
          {n}ª parcela
        </text>
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          Recebido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 border-t-2 border-dashed border-danger" aria-hidden="true" />
          Custo
        </span>
      </figcaption>
    </figure>
  )
}
