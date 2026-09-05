import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Treatment } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { FormField } from './FormField'
import { MoneyInput } from './MoneyInput'
import { Modal } from './Modal'

interface TreatmentsDialogProps {
  open: boolean
  onClose: () => void
  treatments: Treatment[]
  onChange: (treatments: Treatment[]) => void
}

export function TreatmentsDialog({ open, onClose, treatments, onChange }: TreatmentsDialogProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [cost, setCost] = useState(0)
  const [error, setError] = useState<string | undefined>()

  function handleAdd() {
    if (!name.trim()) {
      setError('Informe um nome para o tratamento.')
      return
    }
    if (price <= 0) {
      setError('O valor do tratamento deve ser maior que zero.')
      return
    }
    if (cost < 0) {
      setError('O custo direto não pode ser negativo.')
      return
    }

    const treatment: Treatment = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      price,
      cost,
    }
    onChange([...treatments, treatment])
    setName('')
    setPrice(0)
    setCost(0)
    setError(undefined)
  }

  function handleRemove(id: string) {
    onChange(treatments.filter((t) => t.id !== id))
  }

  return (
    <Modal open={open} title="Tratamentos cadastrados" onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-5">
        <p className="text-xs text-muted">
          Os tratamentos cadastrados ficam salvos somente neste navegador.
        </p>

        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {treatments.length === 0 && (
            <li className="p-4 text-sm text-muted">Nenhum tratamento cadastrado.</li>
          )}
          {treatments.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-medium text-text">{t.name}</p>
                <p className="text-xs text-muted">
                  {formatCurrency(t.price)} · custo {formatCurrency(t.cost)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Excluir ${t.name}`}
                onClick={() => handleRemove(t.id)}
                className="rounded-full p-2 text-muted transition hover:bg-background hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <h3 className="font-heading text-sm font-bold text-text">Adicionar tratamento</h3>

          <FormField label="Nome">
            {({ inputId }) => (
              <input
                id={inputId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Valor">
              {({ inputId }) => <MoneyInput id={inputId} value={price} onChange={setPrice} />}
            </FormField>
            <FormField label="Custo direto">
              {({ inputId }) => <MoneyInput id={inputId} value={cost} onChange={setCost} />}
            </FormField>
          </div>

          {error && <p className="text-xs font-medium text-danger">{error}</p>}

          <button
            type="button"
            onClick={handleAdd}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-light"
          >
            <Plus size={16} />
            Adicionar tratamento
          </button>
        </div>
      </div>
    </Modal>
  )
}
