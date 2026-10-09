// Cartão de indicador: rótulo, ícone, valor em destaque (números tabulares), variação contra o período anterior,
// mini gráfico e dica explicativa. Só dados reais: sem `anterior`, não mostra variação; sem `serie`, sem gráfico.
// Portado do design-system-haddad/react/StatCard.tsx (mesma API; a dica agora é um tooltip acessível).
import { ArrowDownRight, ArrowUpRight, Info, Minus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Sparkline } from './Sparkline'
import { Tooltip } from './Tooltip'
import { cx } from './cx'
import { COR, type Tom } from './tones'

const TEXTO: Record<Tom, string> = {
  neutro: 'text-foreground',
  primario: 'text-primary',
  ciano: 'text-cyan',
  sucesso: 'text-success',
  atencao: 'text-warning',
  critico: 'text-danger',
}

export function StatCard({
  rotulo,
  valor,
  icone: Icone,
  tom = 'neutro',
  dica,
  atual,
  anterior,
  rotuloAnterior = 'período anterior',
  subirEhBom = true,
  serie,
  rotuloSerie,
  detalhe,
  className,
}: {
  rotulo: string
  valor: string
  icone?: LucideIcon
  tom?: Tom
  /** explicação curta de como o número é calculado (aparece no ícone de informação) */
  dica?: string
  /** números crus para calcular a variação */
  atual?: number
  anterior?: number
  rotuloAnterior?: string
  subirEhBom?: boolean
  serie?: number[]
  rotuloSerie?: string
  detalhe?: ReactNode
  className?: string
}) {
  let variacao: ReactNode = null
  if (atual !== undefined && anterior !== undefined) {
    const dif = atual - anterior
    const pct = anterior === 0 ? null : (dif / anterior) * 100
    const bom = dif === 0 ? null : dif > 0 === subirEhBom
    const Seta = dif > 0 ? ArrowUpRight : dif < 0 ? ArrowDownRight : Minus
    variacao = (
      <span
        className={cx(
          'num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
          bom === null ? 'bg-muted text-muted-foreground' : bom ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
        )}
        title={`Antes: ${anterior.toLocaleString('pt-BR')} (${rotuloAnterior})`}
      >
        <Seta className="size-3" aria-hidden />
        {pct === null ? (dif > 0 ? `+${dif}` : `${dif}`) : `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`}
      </span>
    )
  }

  return (
    <div className={cx('card-surface enter relative overflow-hidden rounded-2xl p-4', className)}>
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${COR[tom]}, transparent)`, opacity: 0.8 }}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
        <div className="flex items-center gap-1.5">
          {dica && (
            <Tooltip content={dica} align="end">
              <button
                type="button"
                aria-label="Como é calculado"
                className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            </Tooltip>
          )}
          {Icone && (
            <span className="grid size-8 place-items-center rounded-lg bg-muted" style={{ color: COR[tom] }}>
              <Icone className="size-4" aria-hidden />
            </span>
          )}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <p
          key={valor}
          className={cx(
            'num value-in text-[clamp(1.25rem,2vw,1.75rem)] font-semibold leading-tight tracking-tight',
            TEXTO[tom],
          )}
        >
          {valor}
        </p>
        {variacao}
      </div>
      {detalhe && <div className="mt-1 text-xs text-muted-foreground">{detalhe}</div>}
      {serie && serie.length > 1 && (
        <div className="mt-2">
          <Sparkline valores={serie} cor={COR[tom === 'neutro' ? 'ciano' : tom]} rotulo={rotuloSerie} />
        </div>
      )}
    </div>
  )
}
