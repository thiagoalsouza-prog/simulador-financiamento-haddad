// Mini gráfico de tendência em SVG puro (sem biblioteca). Recebe só números reais; com menos de 2 pontos não desenha nada.
// Portado do design-system-haddad/react/Sparkline.tsx (mesma API).
import { useId } from 'react'

export function Sparkline({
  valores,
  cor = 'var(--cyan)',
  altura = 32,
  rotulo,
}: {
  valores: number[]
  cor?: string
  altura?: number
  rotulo?: string
}) {
  const id = useId().replace(/:/g, '')
  if (valores.length < 2) return null
  const w = 120
  const h = altura
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  const faixa = max - min || 1
  const pts = valores.map(
    (v, i) => [(i / (valores.length - 1)) * w, h - 3 - ((v - min) / faixa) * (h - 6)] as const,
  )
  const linha = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={cor} stopOpacity=".28" />
          <stop offset="1" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linha} L${w} ${h} L0 ${h}Z`} fill={`url(#g${id})`} />
      <path
        d={linha}
        fill="none"
        stroke={cor}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
