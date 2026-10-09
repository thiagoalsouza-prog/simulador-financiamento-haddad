// Cabeçalho padrão das telas: rótulo pequeno opcional, título, descrição curta e ações à direita.
// Portado do design-system-haddad/react/PageHeader.tsx (mesma API).
import type { ReactNode } from 'react'

export function PageHeader({
  titulo,
  descricao,
  acoes,
  sobretitulo,
}: {
  titulo: string
  descricao?: ReactNode
  acoes?: ReactNode
  sobretitulo?: string
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {sobretitulo && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan">{sobretitulo}</p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">{titulo}</h1>
        {descricao && <div className="mt-1 max-w-2xl text-sm text-muted-foreground">{descricao}</div>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  )
}
