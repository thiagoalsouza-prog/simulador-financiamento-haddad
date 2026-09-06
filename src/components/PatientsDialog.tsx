import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { searchPatients, type PatientRecord } from '../api/patients'
import { maskPhone } from '../utils/phone'
import { Modal } from './Modal'

interface PatientsDialogProps {
  open: boolean
  onClose: () => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function PatientsDialog({ open, onClose }: PatientsDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientRecord[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | undefined>()
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError(undefined)

    try {
      const rows = await searchPatients(query.trim())
      setResults(rows)
      setHasSearched(true)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Não foi possível buscar pacientes.')
    }
  }

  return (
    <Modal open={open} title="Pacientes salvos" onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted">
          Busca por nome ou telefone de pacientes salvos anteriormente com o botão "Salvar
          paciente". Informações internas — não aparecem na proposta.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou telefone"
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={16} />
            Buscar
          </button>
        </form>

        {status === 'error' && error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {status === 'loading' && <p className="text-sm text-muted">Buscando...</p>}

        {status === 'idle' && hasSearched && results.length === 0 && (
          <p className="text-sm text-muted">Nenhum paciente encontrado.</p>
        )}

        {results.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {results.map((patient) => (
              <li key={patient.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-medium text-text">{patient.nome}</p>
                  <p className="text-xs text-muted">{maskPhone(patient.telefone)}</p>
                </div>
                <span className="text-xs text-muted">{formatDate(patient.criado_em)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
