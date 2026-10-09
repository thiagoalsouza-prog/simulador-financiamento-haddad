import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Banknote,
  ChartBar,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FilterX,
  Pencil,
  Search,
  SearchX,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { searchPatients, type PatientRecord } from '../api/patients'
import { maskCpf } from '../utils/cpf'
import { formatCurrency } from '../utils/currency'
import { formatInstallments, formatPercent } from '../utils/numbers'
import { maskPhone } from '../utils/phone'
import {
  NO_FILTERS,
  NO_SIMULATION_LABEL,
  PAGE_SIZES,
  distributionByTreatment,
  filterPatients,
  hasActiveFilters,
  loadViewPrefs,
  paginate,
  saveViewPrefs,
  sortPatients,
  summarizePatients,
  treatmentOptions,
  type PatientsFilters,
  type PeriodFilter,
  type SituationFilter,
  type SortDir,
  type SortKey,
  type ViewPrefs,
} from '../utils/patientsView'
import { Alert } from './ui/Alert'
import { Badge } from './ui/Badge'
import { BarList } from './ui/BarList'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { Drawer } from './ui/Drawer'
import { EmptyState } from './ui/EmptyState'
import { PageHeader } from './ui/PageHeader'
import { ProgressRing } from './ui/ProgressRing'
import { Skeleton } from './ui/Skeleton'
import { StatCard } from './ui/StatCard'
import { cx } from './ui/cx'

interface PatientsPageProps {
  onBack: () => void
  onEdit: (patient: PatientRecord) => void
}

const SEARCH_DEBOUNCE_MS = 350

const SORT_OPTIONS: { value: `${SortKey}:${SortDir}`; label: string }[] = [
  { value: 'atualizado:desc', label: 'Mais recentes' },
  { value: 'atualizado:asc', label: 'Mais antigos' },
  { value: 'nome:asc', label: 'Nome (A–Z)' },
  { value: 'nome:desc', label: 'Nome (Z–A)' },
  { value: 'valor:desc', label: 'Maior valor de tratamento' },
  { value: 'valor:asc', label: 'Menor valor de tratamento' },
  { value: 'total:desc', label: 'Maior total a receber' },
  { value: 'total:asc', label: 'Menor total a receber' },
]

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

/** Data e hora em linhas separadas, para a coluna "Atualizado" caber sem quebrar no meio. */
function splitDate(iso: string): { day: string; time: string } {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { day: iso, time: '' }
  return {
    day: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function LabeledSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field">
        {children}
      </select>
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  prefs,
  onSort,
  className,
  align = 'left',
}: {
  label: string
  sortKey: SortKey
  prefs: ViewPrefs
  onSort: (key: SortKey) => void
  className?: string
  align?: 'left' | 'right'
}) {
  const active = prefs.ordem === sortKey
  const Icon = !active ? ArrowUpDown : prefs.direcao === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (prefs.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cx('px-4 py-2.5 font-semibold', align === 'right' && 'text-right', className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cx(
          'inline-flex items-center gap-1 rounded uppercase tracking-wider transition-colors hover:text-foreground',
          active && 'text-foreground',
        )}
      >
        {label}
        <Icon className={cx('size-3.5', !active && 'opacity-50')} aria-hidden />
      </button>
    </th>
  )
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((row) => (
        <tr key={row} className="border-t border-border">
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-28" />
          </td>
          <td className="hidden px-4 py-3.5 xl:table-cell">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="hidden px-4 py-3.5 xl:table-cell">
            <Skeleton className="ml-auto h-4 w-20" />
          </td>
          <td className="hidden px-4 py-3.5 md:table-cell">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="hidden px-4 py-3.5 md:table-cell">
            <Skeleton className="ml-auto h-4 w-24" />
          </td>
          <td className="hidden px-4 py-3.5 xl:table-cell">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="ml-auto h-8 w-8" />
          </td>
        </tr>
      ))}
    </>
  )
}

export function PatientsPage({ onBack, onEdit }: PatientsPageProps) {
  const [prefs, setPrefs] = useState<ViewPrefs>(() => loadViewPrefs())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientRecord[]>([])
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [error, setError] = useState<string | undefined>()
  const [searched, setSearched] = useState('')
  const [filters, setFilters] = useState<PatientsFilters>(NO_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const requestId = useRef(0)
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchRef = useRef<HTMLInputElement>(null)

  // busca no servidor; respostas fora de ordem são descartadas (vale a mais recente)
  const fetchPatients = useCallback((q: string) => {
    const id = ++requestId.current
    searchPatients(q)
      .then((rows) => {
        if (id !== requestId.current) return
        setResults(rows)
        setSearched(q.trim())
        setPage(1)
        setStatus('idle')
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Não foi possível buscar pacientes.')
      })
  }, [])

  const runSearch = useCallback(
    (q: string) => {
      setStatus('loading')
      setError(undefined)
      fetchPatients(q)
    },
    [fetchPatients],
  )

  useEffect(() => {
    fetchPatients('') // o estado inicial já é "carregando"
    // computador: já abre com o cursor na busca (Ctrl+K → digitar). No celular não abre o teclado sozinho.
    if (window.matchMedia?.('(pointer: fine)').matches) searchRef.current?.focus()
    return () => {
      requestId.current += 1
      clearTimeout(debounce.current)
    }
  }, [fetchPatients])

  function handleQueryChange(value: string) {
    setQuery(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearTimeout(debounce.current)
    runSearch(query)
  }

  function updatePrefs(next: ViewPrefs) {
    setPrefs(next)
    saveViewPrefs(next)
    setPage(1)
  }

  function handleSort(key: SortKey) {
    if (prefs.ordem === key) updatePrefs({ ...prefs, direcao: prefs.direcao === 'asc' ? 'desc' : 'asc' })
    else updatePrefs({ ...prefs, ordem: key, direcao: key === 'nome' ? 'asc' : 'desc' })
  }

  function updateFilters(next: Partial<PatientsFilters>) {
    setFilters((current) => ({ ...current, ...next }))
    setPage(1)
  }

  const treatments = useMemo(() => treatmentOptions(results), [results])
  const filtered = useMemo(() => filterPatients(results, filters), [results, filters])
  const sorted = useMemo(() => sortPatients(filtered, prefs.ordem, prefs.direcao), [filtered, prefs.ordem, prefs.direcao])
  const view = useMemo(() => paginate(sorted, page, prefs.porPagina), [sorted, page, prefs.porPagina])
  const summary = useMemo(() => summarizePatients(filtered), [filtered])
  const distribution = useMemo(() => distributionByTreatment(filtered), [filtered])
  const selected = results.find((patient) => patient.id === selectedId) ?? null

  const filtersActive = hasActiveFilters(filters)
  const firstLoad = status === 'loading' && results.length === 0
  const showEmpty = status === 'idle' && view.rows.length === 0
  const showTable = !showEmpty && !(status === 'error' && results.length === 0)

  return (
    <div className="enter">
      <PageHeader
        sobretitulo="Atendimento"
        titulo="Pacientes salvos"
        descricao="Informações internas — não aparecem na proposta."
        acoes={
          <Button variant="outline" onClick={onBack} aria-label="Voltar ao simulador">
            <ArrowLeft aria-hidden />
            Simulador
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="stagger grid grid-cols-2 gap-3 xl:col-span-2">
          {firstLoad ? (
            [0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-[104px] rounded-2xl" />)
          ) : (
            <>
              <StatCard
                rotulo="Pacientes na lista"
                valor={String(summary.total)}
                icone={Users}
                tom="primario"
                detalhe={
                  summary.total !== results.length
                    ? `de ${results.length} carregados`
                    : results.length >= 50
                      ? 'Mostrando os 50 mais recentes'
                      : undefined
                }
              />
              <StatCard
                rotulo="Com simulação"
                valor={String(summary.withSimulation)}
                icone={FileCheck2}
                tom="sucesso"
                detalhe={`${summary.total - summary.withSimulation} sem simulação`}
              />
              <StatCard
                rotulo="Valor simulado"
                valor={formatCurrency(summary.simulatedValue)}
                icone={Stethoscope}
                tom="ciano"
                dica="Soma do valor do tratamento da última simulação de cada paciente da lista. Não é faturamento."
              />
              <StatCard
                rotulo="A receber (simulado)"
                valor={formatCurrency(summary.simulatedReceivable)}
                icone={Banknote}
                tom="sucesso"
                dica="Soma do total a receber (entrada + parcelas) das últimas simulações da lista. São projeções, não contratos fechados."
              />
            </>
          )}
        </div>

        {firstLoad ? (
          <Skeleton className="h-[224px] rounded-2xl" />
        ) : (
          <Card className="enter p-4">
            <CardHeader
              icon={ChartBar}
              title="Pacientes por tratamento"
              description="Pela última simulação de cada paciente da lista."
            />
            <div className="mt-4">
              {distribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem pacientes na lista.</p>
              ) : (
                <BarList
                  items={distribution.map((group) => ({
                    label: group.label,
                    value: group.count,
                    detail:
                      group.label === NO_SIMULATION_LABEL
                        ? `${group.count}`
                        : `${group.count} · ${formatCurrency(group.value)}`,
                  }))}
                />
              )}
            </div>
          </Card>
        )}
      </div>

      <Card className="overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-b border-border p-4">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Buscar por nome ou telefone"
                aria-label="Buscar por nome ou telefone"
                autoComplete="off"
                className="field pl-9"
              />
            </div>
            <Button type="submit" disabled={status === 'loading'}>
              <Search aria-hidden />
              Buscar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <LabeledSelect
              label="Situação"
              value={filters.situacao}
              onChange={(value) => updateFilters({ situacao: value as SituationFilter })}
            >
              <option value="todos">Todos</option>
              <option value="com">Com simulação</option>
              <option value="sem">Sem simulação</option>
            </LabeledSelect>
            <LabeledSelect
              label="Tratamento"
              value={filters.tratamento}
              onChange={(value) => updateFilters({ tratamento: value })}
            >
              <option value="">Todos</option>
              {treatments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </LabeledSelect>
            <LabeledSelect
              label="Atualizado"
              value={filters.periodo}
              onChange={(value) => updateFilters({ periodo: value as PeriodFilter })}
            >
              <option value="todos">Qualquer data</option>
              <option value="hoje">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </LabeledSelect>
            <LabeledSelect
              label="Ordenar por"
              value={`${prefs.ordem}:${prefs.direcao}`}
              onChange={(value) => {
                const [ordem, direcao] = value.split(':') as [SortKey, SortDir]
                updatePrefs({ ...prefs, ordem, direcao })
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LabeledSelect>
          </div>

          {filtersActive && (
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Filtros aplicados à lista carregada.</span>
              <Button variant="ghost" size="sm" onClick={() => updateFilters(NO_FILTERS)}>
                <FilterX aria-hidden />
                Limpar filtros
              </Button>
            </div>
          )}
        </form>

        {status === 'error' && error && (
          <div className="p-4">
            <Alert tone="danger" role="alert">
              <span className="flex flex-wrap items-center justify-between gap-3">
                {error}
                <Button variant="outline" size="sm" onClick={() => runSearch(query)}>
                  Tentar novamente
                </Button>
              </span>
            </Alert>
          </div>
        )}

        <p role="status" className="sr-only">
          {status === 'loading' ? 'Buscando...' : `${sorted.length} paciente(s) na lista.`}
        </p>

        {showEmpty ? (
          <div className="p-4">
            {results.length === 0 ? (
              <EmptyState
                icone={searched ? SearchX : Users}
                titulo="Nenhum paciente encontrado."
                descricao={
                  searched
                    ? `Nada encontrado para "${searched}". Confira o nome ou o telefone digitado.`
                    : 'Quando você salvar um paciente no simulador, ele aparece aqui.'
                }
                acao={
                  <Button variant="outline" onClick={onBack}>
                    <ArrowLeft aria-hidden />
                    Voltar ao simulador
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icone={FilterX}
                titulo="Nenhum paciente com esses filtros."
                descricao="Ajuste ou limpe os filtros para ver os pacientes carregados."
                acao={
                  <Button variant="outline" onClick={() => updateFilters(NO_FILTERS)}>
                    <FilterX aria-hidden />
                    Limpar filtros
                  </Button>
                }
              />
            )}
          </div>
        ) : showTable ? (
          <div className="max-h-[70vh] overflow-auto" aria-busy={status === 'loading'}>
            <table className="data-table w-full border-collapse text-sm">
              <caption className="sr-only">Pacientes salvos com a última simulação de cada um</caption>
              <thead>
                <tr className="text-left text-[11px] text-muted-foreground">
                  <SortHeader label="Paciente" sortKey="nome" prefs={prefs} onSort={handleSort} />
                  <th scope="col" className="hidden px-4 py-2.5 font-semibold uppercase tracking-wider xl:table-cell">
                    Tratamento
                  </th>
                  <SortHeader
                    label="Valor"
                    sortKey="valor"
                    prefs={prefs}
                    onSort={handleSort}
                    align="right"
                    className="hidden xl:table-cell"
                  />
                  <th scope="col" className="hidden px-4 py-2.5 font-semibold uppercase tracking-wider md:table-cell">
                    Condição
                  </th>
                  <SortHeader
                    label="Total a receber"
                    sortKey="total"
                    prefs={prefs}
                    onSort={handleSort}
                    align="right"
                    className="hidden md:table-cell"
                  />
                  <SortHeader
                    label="Atualizado"
                    sortKey="atualizado"
                    prefs={prefs}
                    onSort={handleSort}
                    className="hidden xl:table-cell"
                  />
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {firstLoad ? (
                  <SkeletonRows />
                ) : (
                  view.rows.map((patient) => {
                    const sim = patient.simulacao
                    return (
                      <tr
                        key={patient.id}
                        data-selected={selectedId === patient.id}
                        onClick={() => setSelectedId(patient.id)}
                        className="cursor-pointer border-t border-border"
                      >
                        <td className="px-4 py-3 align-top">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedId(patient.id)
                            }}
                            className="rounded text-left font-medium transition-colors hover:text-primary"
                          >
                            {patient.nome}
                          </button>
                          <p className="num mt-0.5 text-xs text-muted-foreground">
                            {maskPhone(patient.telefone)}
                            {patient.cpf ? ` · CPF ${maskCpf(patient.cpf)}` : ''}
                          </p>
                          {sim && (
                            <p className="num mt-1 text-xs text-muted-foreground md:hidden">
                              {formatInstallments(sim.parcelas)} {formatCurrency(sim.valorParcela)} · total{' '}
                              {formatCurrency(sim.totalReceber)}
                            </p>
                          )}
                        </td>
                        <td className="hidden max-w-[220px] px-4 py-3 align-top xl:table-cell">
                          {sim ? (
                            <span className="line-clamp-2">{sim.tratamentoNome}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="num hidden px-4 py-3 text-right align-top xl:table-cell">
                          {sim ? formatCurrency(sim.valorTratamento) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="hidden px-4 py-3 align-top md:table-cell">
                          {sim ? (
                            <>
                              <p className="num font-medium">
                                {formatInstallments(sim.parcelas)} {formatCurrency(sim.valorParcela)}
                              </p>
                              <p className="num text-xs text-muted-foreground">
                                entrada {formatCurrency(sim.entrada)} · {formatPercent(sim.jurosMensalPct, 2)} ao mês
                              </p>
                            </>
                          ) : (
                            <Badge tom="neutro">Sem simulação</Badge>
                          )}
                        </td>
                        <td className="num hidden px-4 py-3 text-right align-top font-semibold md:table-cell">
                          {sim ? (
                            <span className="text-success">{formatCurrency(sim.totalReceber)}</span>
                          ) : (
                            <span className="font-normal text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="num hidden whitespace-nowrap px-4 py-3 align-top text-xs xl:table-cell">
                          <p>{splitDate(patient.atualizado_em).day}</p>
                          <p className="text-muted-foreground">{splitDate(patient.atualizado_em).time}</p>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${patient.nome}`}
                            title={`Editar ${patient.nome}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(patient)
                            }}
                          >
                            <Pencil aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {showTable && !firstLoad && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p className="num">
              Mostrando {view.from}–{view.to} de {sorted.length}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                Por página
                <select
                  value={prefs.porPagina}
                  onChange={(e) => updatePrefs({ ...prefs, porPagina: Number(e.target.value) })}
                  className="field !h-8 !w-auto !text-xs"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Página anterior"
                  disabled={view.page <= 1}
                  onClick={() => setPage(view.page - 1)}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <span className="num min-w-[5.5rem] text-center">
                  Página {view.page} de {view.pages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Próxima página"
                  disabled={view.page >= view.pages}
                  onClick={() => setPage(view.page + 1)}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Drawer
        open={selected !== null}
        title={selected?.nome ?? ''}
        description="Dados salvos e última simulação"
        onClose={() => setSelectedId(null)}
        footer={
          selected && (
            <Button size="lg" className="w-full" onClick={() => onEdit(selected)}>
              <Pencil aria-hidden />
              Editar paciente
            </Button>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="eyebrow mb-3 flex items-center gap-2">
                <UserRound className="size-3.5" aria-hidden />
                Contato
              </h3>
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <dt className="text-xs text-muted-foreground">Telefone</dt>
                  <dd className="num mt-1 text-sm font-semibold">{maskPhone(selected.telefone)}</dd>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <dt className="text-xs text-muted-foreground">CPF</dt>
                  <dd className="num mt-1 text-sm font-semibold">
                    {selected.cpf ? maskCpf(selected.cpf) : <span className="font-normal text-muted-foreground">Não informado</span>}
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <dt className="text-xs text-muted-foreground">Cadastrado em</dt>
                  <dd className="num mt-1 text-sm font-semibold">{formatDate(selected.criado_em)}</dd>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                  <dt className="text-xs text-muted-foreground">Atualizado em</dt>
                  <dd className="num mt-1 text-sm font-semibold">{formatDate(selected.atualizado_em)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="eyebrow mb-3 flex items-center gap-2">
                <Stethoscope className="size-3.5" aria-hidden />
                Última simulação
              </h3>
              {selected.simulacao ? (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface-2/60 p-3 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Tratamento</dt>
                    <dd className="mt-1 text-sm font-semibold">{selected.simulacao.tratamentoNome}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                    <dt className="text-xs text-muted-foreground">Valor do tratamento</dt>
                    <dd className="num mt-1 text-sm font-semibold">{formatCurrency(selected.simulacao.valorTratamento)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-2/60 p-3">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Entrada</dt>
                      <dd className="num mt-1 text-sm font-semibold">{formatCurrency(selected.simulacao.entrada)}</dd>
                    </div>
                    {selected.simulacao.valorTratamento > 0 && (
                      <ProgressRing
                        value={(selected.simulacao.entrada / selected.simulacao.valorTratamento) * 100}
                        size={44}
                        stroke={5}
                        color="var(--cyan)"
                        label={`Entrada de ${formatPercent((selected.simulacao.entrada / selected.simulacao.valorTratamento) * 100, 1)} do valor do tratamento`}
                      >
                        {Math.round((selected.simulacao.entrada / selected.simulacao.valorTratamento) * 100)}%
                      </ProgressRing>
                    )}
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                    <dt className="text-xs text-muted-foreground">Juros ao mês</dt>
                    <dd className="num mt-1 text-sm font-semibold">{formatPercent(selected.simulacao.jurosMensalPct, 2)}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                    <dt className="text-xs text-muted-foreground">Parcelas</dt>
                    <dd className="num mt-1 text-sm font-semibold">
                      {formatInstallments(selected.simulacao.parcelas)} de{' '}
                      {formatCurrency(selected.simulacao.valorParcela)}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-success/30 bg-success-soft p-3 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Total a receber</dt>
                    <dd className="num mt-1 text-lg font-semibold text-success">
                      {formatCurrency(selected.simulacao.totalReceber)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="rounded-xl border border-dashed border-input p-4 text-sm text-muted-foreground">
                  Nenhuma simulação salva para este paciente.
                </p>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}
