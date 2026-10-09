// Estado vazio padrão: ícone, frase curta e a ação que resolve.
// Portado do design-system-haddad/react/EmptyState.tsx (mesma API).
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icone: Icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: LucideIcon
  titulo: string
  descricao?: ReactNode
  acao?: ReactNode
}) {
  return (
    <div className="card-surface enter flex flex-col items-center gap-2 rounded-2xl px-6 py-10 text-center">
      {Icone && (
        <span className="mb-1 grid size-11 place-items-center rounded-xl bg-muted text-cyan">
          <Icone className="size-5" aria-hidden />
        </span>
      )}
      <p className="font-medium">{titulo}</p>
      {descricao && <div className="max-w-md text-sm text-muted-foreground">{descricao}</div>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  )
}
