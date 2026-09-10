import { ArrowLeft, ChevronDown, Pencil, Search } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { searchPatients, type PatientRecord } from '../api/patients'
import { formatCurrency } from '../utils/currency'
import { formatInstallments, formatPercent } from '../utils/numbers'
import { maskPhone } from '../utils/phone'

interface PatientsPageProps {
  onBack: () => void
  onEdit: (patient: PatientRecord) => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function PatientsPage({ onBack, onEdit }: PatientsPageProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientRecord[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | undefined>()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const runSearch = useCallback(async (q: string) => {
    setStatus('loading')
    setError(undefined)
    try {
      const rows = await searchPatients(q)
      setResults(rows)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Não foi possível buscar pacientes.')
    }
  }, [])

  useEffect(() => {
    runSearch('')
  }, [runSearch])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    runSearch(query)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar ao simulador"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading text-lg font-bold text-text">Pacientes salvos</h1>
          <p className="text-xs text-muted">Informações internas — não aparecem na proposta.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search size={16} />
          Buscar
        </button>
      </form>

      {status === 'error' && error && (
        <p role="alert" className="mb-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {status === 'loading' && <p className="mb-4 text-sm text-muted">Buscando...</p>}

      {status === 'idle' && results.length === 0 && (
        <p className="text-sm text-muted">Nenhum paciente encontrado.</p>
      )}

      <ul className="flex flex-col gap-3">
        {results.map((patient) => {
          const isExpanded = expandedId === patient.id
          return (
            <li key={patient.id} className="rounded-2xl border border-border bg-surface shadow-soft">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : patient.id)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div>
                  <p className="font-heading text-sm font-bold text-text">{patient.nome}</p>
                  <p className="text-xs text-muted">
                    {maskPhone(patient.telefone)} · atualizado em {formatDate(patient.atualizado_em)}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4">
                  {patient.simulacao ? (
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-background p-3">
                        <dt className="text-xs text-muted">Tratamento</dt>
                        <dd className="mt-1 text-sm font-semibold text-text">
                          {patient.simulacao.tratamentoNome}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <dt className="text-xs text-muted">Valor do tratamento</dt>
                        <dd className="mt-1 text-sm font-semibold text-text">
                          {formatCurrency(patient.simulacao.valorTratamento)}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <dt className="text-xs text-muted">Entrada</dt>
                        <dd className="mt-1 text-sm font-semibold text-text">
                          {formatCurrency(patient.simulacao.entrada)}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <dt className="text-xs text-muted">Juros ao mês</dt>
                        <dd className="mt-1 text-sm font-semibold text-text">
                          {formatPercent(patient.simulacao.jurosMensalPct, 2)}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <dt className="text-xs text-muted">Parcelas</dt>
                        <dd className="mt-1 text-sm font-semibold text-text">
                          {formatInstallments(patient.simulacao.parcelas)} de{' '}
                          {formatCurrency(patient.simulacao.valorParcela)}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <dt className="text-xs text-muted">Total a receber</dt>
                        <dd className="mt-1 text-sm font-semibold text-text">
                          {formatCurrency(patient.simulacao.totalReceber)}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted">Nenhuma simulação salva para este paciente.</p>
                  )}

                  <button
                    type="button"
                    onClick={() => onEdit(patient)}
                    className="mt-4 flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
                  >
                    <Pencil size={14} />
                    Editar paciente
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
