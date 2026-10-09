import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { SimulationOutcome } from '../finance/types'
import { formatCurrency } from '../utils/currency'

interface RecoveryChartProps {
  outcome: SimulationOutcome
  directCost: number
  downPayment: number
}

const DEFAULT_WIDTH = 640
const PAD_LEFT = 58
const PAD_RIGHT = 16
const PAD_TOP = 28
const PAD_BOTTOM = 34

/** Valor curto para o eixo vertical: R$ 950 · R$ 12 mil · R$ 1,2 mi. */
function compactCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (abs >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return `R$ ${Math.round(value)}`
}

/** Marcas redondas (1, 2, 2,5, 5 × 10ⁿ) para as linhas de grade. */
function niceTicks(max: number, count = 5): number[] {
  if (!(max > 0)) return [0]
  const rough = max / count
  const pow = 10 ** Math.floor(Math.log10(rough))
  const fraction = rough / pow
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  const step = nice * pow
  const ticks: number[] = []
  for (let value = 0; value <= max + step * 1e-6; value += step) ticks.push(value)
  return ticks
}

function installmentLabel(index: number): string {
  return index === 0 ? 'Entrada' : `${index}ª parcela`
}

export function RecoveryChart({ outcome, directCost, downPayment }: RecoveryChartProps) {
  const { schedule, costRecovery, principal, principalRecovery } = outcome
  const uid = useId().replace(/:/g, '')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [hover, setHover] = useState<number | null>(null)

  // o gráfico é desenhado no tamanho real da tela: textos legíveis também no celular
  useEffect(() => {
    const element = wrapRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width
      if (next && next > 0) setWidth(Math.max(280, Math.round(next)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const cumulative = useMemo(() => {
    const values: number[] = [downPayment]
    let acc = downPayment
    for (const row of schedule) {
      acc += row.payment
      values.push(acc)
    }
    return values
  }, [schedule, downPayment])

  // telas estreitas: sem rótulos soltos sobre as linhas (colidem com os marcadores); os valores vão para a legenda
  const compact = width < 520
  const height = compact ? 240 : 280
  const innerWidth = width - PAD_LEFT - PAD_RIGHT
  const innerHeight = height - PAD_TOP - PAD_BOTTOM
  const n = cumulative.length - 1
  const maxValue = Math.max(...cumulative, directCost, principal) * 1.08 || 1

  const xFor = (index: number) => PAD_LEFT + (n === 0 ? 0 : (index / n) * innerWidth)
  const yFor = (value: number) => PAD_TOP + innerHeight - (value / maxValue) * innerHeight

  const linePoints = cumulative.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ')
  const areaPoints = `${xFor(0)},${yFor(0)} ${linePoints} ${xFor(n)},${yFor(0)}`
  const ticks = niceTicks(maxValue)

  const costY = yFor(directCost)
  const principalY = yFor(principal)
  // a linha mais alta leva o rótulo por cima, a mais baixa por baixo (se houver espaço): nunca se sobrepõem
  const baselineY = height - PAD_BOTTOM
  const costIsUpper = costY <= principalY
  const labelY = (lineY: number, isUpper: boolean) =>
    isUpper || lineY + 14 > baselineY ? lineY - 6 : lineY + 14

  const recoveryIndex = costRecovery.covered ? costRecovery.installment ?? 0 : null
  const principalRecoveryIndex = principalRecovery.covered ? principalRecovery.installment ?? 0 : null
  // o rótulo de cada linha fica no lado oposto ao marcador de recuperação (nunca por cima do "4ª PARCELA")
  const markerInRightHalf = (index: number | null) => index !== null && xFor(index) > PAD_LEFT + innerWidth / 2
  const costLabelAtStart = markerInRightHalf(recoveryIndex)
  const principalLabelAtStart = markerInRightHalf(principalRecoveryIndex)
  const markersClose =
    recoveryIndex !== null &&
    principalRecoveryIndex !== null &&
    Math.abs(xFor(recoveryIndex) - xFor(principalRecoveryIndex)) < 90 &&
    Math.abs(yFor(cumulative[recoveryIndex]) - yFor(cumulative[principalRecoveryIndex])) < 24

  const description = [
    'Gráfico mostrando o recebimento acumulado desde a entrada até a última parcela.',
    costRecovery.covered
      ? `O custo de ${formatCurrency(directCost)} é atingido na ${costRecovery.installment === 0 ? 'entrada' : `${costRecovery.installment}ª parcela`}.`
      : `O custo de ${formatCurrency(directCost)} não é atingido dentro do prazo simulado.`,
    principalRecovery.covered
      ? `O valor principal de ${formatCurrency(principal)} é atingido na ${principalRecovery.installment === 0 ? 'entrada' : `${principalRecovery.installment}ª parcela`}.`
      : `O valor principal de ${formatCurrency(principal)} não é atingido dentro do prazo simulado.`,
  ].join(' ')

  function handlePointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || n === 0) return
    const x = ((event.clientX - rect.left) / rect.width) * width
    const index = Math.round(((x - PAD_LEFT) / innerWidth) * n)
    setHover(Math.max(0, Math.min(n, index)))
  }

  const hoverValue = hover !== null ? cumulative[hover] : null
  const hoverX = hover !== null ? xFor(hover) : 0
  const hoverY = hoverValue !== null ? yFor(hoverValue) : 0
  const tooltipBelow = hoverY < 96

  return (
    <figure className="m-0">
      <div ref={wrapRef} className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${uid}-title ${uid}-desc`}
          className="block w-full touch-pan-y select-none"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHover(null)}
        >
          <title id={`${uid}-title`}>Recuperação do custo e do valor principal ao longo das parcelas</title>
          <desc id={`${uid}-desc`}>{description}</desc>

          <defs>
            <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id={`${uid}-line`}
              gradientUnits="userSpaceOnUse"
              x1={PAD_LEFT}
              y1="0"
              x2={width - PAD_RIGHT}
              y2="0"
            >
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--cyan)" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_LEFT}
                y1={yFor(tick)}
                x2={width - PAD_RIGHT}
                y2={yFor(tick)}
                stroke="var(--border)"
                strokeOpacity={tick === 0 ? 1 : 0.55}
                strokeDasharray={tick === 0 ? undefined : '2 5'}
              />
              <text x={PAD_LEFT - 8} y={yFor(tick) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--muted-foreground)">
                {compactCurrency(tick)}
              </text>
            </g>
          ))}

          <line
            x1={PAD_LEFT}
            y1={costY}
            x2={width - PAD_RIGHT}
            y2={costY}
            stroke="var(--danger)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          {!compact && (
            <text
              x={costLabelAtStart ? PAD_LEFT + 8 : width - PAD_RIGHT}
              y={labelY(costY, costIsUpper)}
              textAnchor={costLabelAtStart ? 'start' : 'end'}
              fontSize="11"
              fill="var(--danger)"
            >
              Custo: {formatCurrency(directCost)}
            </text>
          )}

          <line
            x1={PAD_LEFT}
            y1={principalY}
            x2={width - PAD_RIGHT}
            y2={principalY}
            stroke="var(--warning)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          {!compact && (
            <text
              x={principalLabelAtStart ? PAD_LEFT + 8 : width - PAD_RIGHT}
              y={labelY(principalY, !costIsUpper)}
              textAnchor={principalLabelAtStart ? 'start' : 'end'}
              fontSize="11"
              fill="var(--warning)"
            >
              Valor principal: {formatCurrency(principal)}
            </text>
          )}

          <polygon points={areaPoints} fill={`url(#${uid}-area)`} />
          <polyline
            className="draw"
            pathLength={1}
            points={linePoints}
            fill="none"
            stroke={`url(#${uid}-line)`}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {n <= 36 &&
            cumulative.map((value, index) => (
              <circle key={index} cx={xFor(index)} cy={yFor(value)} r={2.5} fill="var(--primary)" />
            ))}

          {recoveryIndex !== null && (
            <g>
              <circle
                cx={xFor(recoveryIndex)}
                cy={yFor(cumulative[recoveryIndex])}
                r={6}
                fill="var(--card)"
                stroke="var(--danger)"
                strokeWidth={3}
              />
              <text
                x={Math.min(Math.max(xFor(recoveryIndex), PAD_LEFT + 40), width - PAD_RIGHT - 40)}
                y={Math.max(yFor(cumulative[recoveryIndex]) - 14, 14)}
                textAnchor="middle"
                fontSize="11"
                fontWeight={700}
                fill="var(--danger)"
              >
                {recoveryIndex === 0 ? 'ENTRADA' : `${recoveryIndex}ª PARCELA`}
              </text>
            </g>
          )}

          {principalRecoveryIndex !== null && (
            <g>
              <circle
                cx={xFor(principalRecoveryIndex)}
                cy={yFor(cumulative[principalRecoveryIndex])}
                r={6}
                fill="var(--card)"
                stroke="var(--warning)"
                strokeWidth={3}
              />
              <text
                x={Math.min(Math.max(xFor(principalRecoveryIndex), PAD_LEFT + 40), width - PAD_RIGHT - 40)}
                y={
                  markersClose
                    ? yFor(cumulative[principalRecoveryIndex]) + 22
                    : Math.max(yFor(cumulative[principalRecoveryIndex]) - 14, 14)
                }
                textAnchor="middle"
                fontSize="11"
                fontWeight={700}
                fill="var(--warning)"
              >
                {principalRecoveryIndex === 0 ? 'ENTRADA' : `${principalRecoveryIndex}ª PARCELA`}
              </text>
            </g>
          )}

          <text x={PAD_LEFT} y={height - 10} fontSize="11" fill="var(--muted-foreground)">
            Entrada
          </text>
          {n >= 8 && (
            <text x={xFor(Math.round(n / 2))} y={height - 10} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
              {Math.round(n / 2)}ª
            </text>
          )}
          <text x={width - PAD_RIGHT} y={height - 10} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
            {n}ª parcela
          </text>

          {hover !== null && hoverValue !== null && (
            <g aria-hidden="true" pointerEvents="none">
              <line
                x1={hoverX}
                y1={PAD_TOP}
                x2={hoverX}
                y2={baselineY}
                stroke="var(--cyan)"
                strokeOpacity={0.55}
                strokeDasharray="3 4"
              />
              <circle cx={hoverX} cy={hoverY} r={8} fill="var(--cyan)" fillOpacity={0.18} />
              <circle cx={hoverX} cy={hoverY} r={4} fill="var(--card)" stroke="var(--cyan)" strokeWidth={2} />
            </g>
          )}
        </svg>

        {hover !== null && hoverValue !== null && (
          <div
            aria-hidden="true"
            className="card-surface pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-popover px-3 py-2 text-xs shadow-pop"
            style={{
              left: Math.min(Math.max(hoverX, 84), Math.max(84, width - 84)),
              top: tooltipBelow ? hoverY + 14 : hoverY - 14,
              transform: `translate(-50%, ${tooltipBelow ? '0' : '-100%'})`,
            }}
          >
            <p className="font-semibold text-foreground">{installmentLabel(hover)}</p>
            <p className="num mt-0.5 text-muted-foreground">
              Recebido: <span className="font-medium text-foreground">{formatCurrency(hoverValue)}</span>
            </p>
            <p className="num text-muted-foreground">
              Custo:{' '}
              <span className={hoverValue >= directCost ? 'font-medium text-success' : 'font-medium text-danger'}>
                {hoverValue >= directCost ? 'coberto' : `faltam ${formatCurrency(directCost - hoverValue)}`}
              </span>
            </p>
            <p className="num text-muted-foreground">
              Principal:{' '}
              <span className={hoverValue >= principal ? 'font-medium text-success' : 'font-medium text-warning'}>
                {hoverValue >= principal ? 'coberto' : `faltam ${formatCurrency(principal - hoverValue)}`}
              </span>
            </p>
          </div>
        )}
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          Recebido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 border-t-2 border-dashed border-danger" aria-hidden="true" />
          <span className="num">{compact ? `Custo: ${formatCurrency(directCost)}` : 'Custo'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 border-t-2 border-dashed border-warning" aria-hidden="true" />
          <span className="num">{compact ? `Valor principal: ${formatCurrency(principal)}` : 'Valor principal'}</span>
        </span>
        <span className="ml-auto hidden sm:inline">Passe o mouse ou toque no gráfico para ver cada parcela.</span>
      </figcaption>
    </figure>
  )
}
