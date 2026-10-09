// Estrutura padrão Haddad: barra lateral escura recolhível (lembra no aparelho), gaveta no celular, busca rápida de
// paciente (Ctrl+K), tema claro/escuro e a marca da clínica. Segue o padrão do design-system-haddad/react/Sidebar.tsx,
// adaptado a um app sem roteador: os itens chamam `onSelect` em vez de navegar por URL.
import { ChevronsLeft, ChevronsRight, Menu, Search, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { safeGetItem, safeSetItem } from '../../storage/safeStorage'
import type { Theme } from '../../storage/theme'
import { Portal } from '../ui/Portal'
import { cx } from '../ui/cx'
import { useDialogA11y } from '../ui/useDialogA11y'
import { ThemeToggle } from './ThemeToggle'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  onSelect: () => void
  /** página atual (recebe o destaque luminoso) */
  active?: boolean
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

interface AppShellProps {
  groups: NavGroup[]
  theme: Theme
  onToggleTheme: () => void
  onSearchPatients: () => void
  children: ReactNode
}

const SYSTEM_NAME = 'Simulador de financiamento'

function HMark() {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#3b82f6] via-[#22d3ee] to-[#10b981] text-sm font-bold text-[#06101f] shadow-[0_0_24px_-6px_rgb(34_211_238/0.7)]"
    >
      H
    </span>
  )
}

/** Logo da clínica recortada pelo CSS. É preta sobre fundo branco: invertida + `screen` ela vira branca sobre o fundo escuro. */
function Brand({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center py-5">
        <HMark />
      </div>
    )
  }
  return (
    <div className="px-5 pb-4 pt-5">
      <div className="aspect-[576/198] w-[172px] overflow-hidden">
        <img src="/logo-haddad.png" alt="" className="h-full w-full object-cover mix-blend-screen invert" />
      </div>
      <span className="sr-only">Clínica Haddad. </span>
      <p className="mt-1.5 truncate text-[11px] tracking-wide text-sidebar-foreground/70">{SYSTEM_NAME}</p>
    </div>
  )
}

function SearchButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? 'Pesquisar paciente' : undefined}
      title={collapsed ? 'Pesquisar paciente (Ctrl+K)' : undefined}
      className={cx(
        'flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-white/[0.03] px-3 py-2 text-left text-sm text-sidebar-foreground/80 transition-colors hover:border-cyan/30 hover:bg-sidebar-accent/60 hover:text-white',
        collapsed && 'justify-center px-0',
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">Pesquisar paciente</span>
          <kbd className="rounded border border-sidebar-border px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/60 [@media(pointer:coarse)]:hidden">
            Ctrl K
          </kbd>
        </>
      )}
    </button>
  )
}

function NavList({
  groups,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[]
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Menu principal" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
      {groups.map((group, index) => (
        <div key={group.title ?? `grupo-${index}`}>
          {group.title && !collapsed && (
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.title}
            </p>
          )}
          {group.title && collapsed && <div className="mx-3 mb-2 border-t border-sidebar-border" />}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      item.onSelect()
                      onNavigate?.()
                    }}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={item.active ? 'page' : undefined}
                    className={cx(
                      'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                      collapsed && 'justify-center px-0',
                      item.active
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgb(34_211_238/0.12)] before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-[#22d3ee] before:shadow-[0_0_10px_#22d3ee]'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white',
                    )}
                  >
                    <Icon className={cx('size-4 shrink-0', item.active && 'text-[#22d3ee]')} aria-hidden />
                    {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function MobileMenu({
  groups,
  theme,
  onToggleTheme,
  onSearchPatients,
  onClose,
}: Omit<AppShellProps, 'children'> & { onClose: () => void }) {
  const panelRef = useDialogA11y<HTMLDivElement>(true, onClose)
  return (
    <Portal>
      <div className="fixed inset-0 z-40 lg:hidden">
        <div className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm" onMouseDown={onClose} aria-hidden="true" />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] animate-slide-left flex-col bg-sidebar text-sidebar-foreground shadow-pop outline-none"
        >
          <div className="flex items-start justify-between">
            <Brand collapsed={false} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="mr-3 mt-4 grid size-9 place-items-center rounded-lg hover:bg-sidebar-accent"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="px-3 pb-4">
            <SearchButton
              collapsed={false}
              onClick={() => {
                onSearchPatients()
                onClose()
              }}
            />
          </div>
          <NavList groups={groups} collapsed={false} onNavigate={onClose} />
          <div className="border-t border-sidebar-border px-3 py-3">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    </Portal>
  )
}

export function AppShell({ groups, theme, onToggleTheme, onSearchPatients, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(() => safeGetItem('menu-recolhido') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleCollapsed() {
    setCollapsed((current) => {
      safeSetItem('menu-recolhido', current ? '0' : '1')
      return !current
    })
  }

  // Ctrl+K (ou ⌘K) abre a busca de pacientes de qualquer tela
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onSearchPatients()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onSearchPatients])

  return (
    <div className="min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      {/* computador: barra lateral fixa, recolhível */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex print:hidden',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        <Brand collapsed={collapsed} />
        <div className="px-3 pb-4">
          <SearchButton collapsed={collapsed} onClick={onSearchPatients} />
        </div>
        <NavList groups={groups} collapsed={collapsed} />
        <div className="px-3 pb-1">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : undefined}
            className={cx(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <ChevronsLeft className="size-4" aria-hidden />}
            {!collapsed && 'Recolher menu'}
          </button>
        </div>
        <div className="border-t border-sidebar-border px-3 py-3">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} collapsed={collapsed} />
        </div>
      </aside>

      {/* celular e tablet: barra superior + gaveta */}
      <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border px-4 lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="-ml-2 grid size-10 place-items-center rounded-lg hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
        <HMark />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{SYSTEM_NAME}</span>
        <button
          type="button"
          onClick={onSearchPatients}
          aria-label="Buscar pacientes"
          className="grid size-10 place-items-center rounded-lg hover:bg-muted"
        >
          <Search className="size-5" />
        </button>
      </header>
      {mobileOpen && (
        <MobileMenu
          groups={groups}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onSearchPatients={onSearchPatients}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div className={cx('transition-[padding] duration-200', collapsed ? 'lg:pl-[68px]' : 'lg:pl-64')}>
        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[1440px] px-4 py-6 outline-none md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
