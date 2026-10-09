import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../../storage/theme'
import { cx } from '../ui/cx'

/** Botão claro/escuro da barra lateral. Escuro é o padrão; a escolha fica salva no aparelho. */
export function ThemeToggle({
  theme,
  onToggle,
  collapsed = false,
}: {
  theme: Theme
  onToggle: () => void
  collapsed?: boolean
}) {
  const goingLight = theme === 'escuro'
  const label = goingLight ? 'Tema claro' : 'Tema escuro'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={goingLight ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={collapsed ? label : undefined}
      className={cx(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-white',
        collapsed && 'justify-center px-0',
      )}
    >
      {goingLight ? <Sun className="size-4 shrink-0" aria-hidden /> : <Moon className="size-4 shrink-0" aria-hidden />}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}
