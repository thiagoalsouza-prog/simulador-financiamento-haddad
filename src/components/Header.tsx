import { ClipboardList, Moon, Settings, Sun } from 'lucide-react'
import type { Theme } from '../storage/theme'
import type { View } from '../types'

interface HeaderProps {
  view: View
  onChangeView: (view: View) => void
  onOpenTreatments: () => void
  onOpenRiskSettings: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function Header({
  view,
  onChangeView,
  onOpenTreatments,
  onOpenRiskSettings,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-white"
          >
            H
          </div>
          <div>
            <h1 className="font-heading text-base font-bold leading-tight text-text sm:text-lg">
              Clínica Haddad
            </h1>
            <p className="text-xs text-muted">Planejamento financeiro</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <nav
            aria-label="Alternar visão"
            className="flex rounded-full border border-border bg-background p-1 text-sm"
          >
            <button
              type="button"
              aria-pressed={view === 'commercial'}
              onClick={() => onChangeView('commercial')}
              className={`rounded-full px-3 py-1.5 font-medium transition sm:px-4 ${
                view === 'commercial' ? 'bg-primary text-white shadow-soft' : 'text-muted hover:text-text'
              }`}
            >
              Visão comercial
            </button>
            <button
              type="button"
              aria-pressed={view === 'manager'}
              onClick={() => onChangeView('manager')}
              className={`rounded-full px-3 py-1.5 font-medium transition sm:px-4 ${
                view === 'manager' ? 'bg-primary text-white shadow-soft' : 'text-muted hover:text-text'
              }`}
            >
              Área gerencial
            </button>
          </nav>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-primary hover:text-primary"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            onClick={onOpenTreatments}
            aria-label="Tratamentos cadastrados"
            title="Tratamentos cadastrados"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-primary hover:text-primary"
          >
            <ClipboardList size={18} />
          </button>

          <button
            type="button"
            onClick={onOpenRiskSettings}
            aria-label="Configurações de risco"
            title="Configurações"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-primary hover:text-primary"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
