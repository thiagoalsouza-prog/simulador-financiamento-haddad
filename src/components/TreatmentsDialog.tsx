import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Treatment } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { FormField } from './FormField'
import { MoneyInput } from './MoneyInput'
import { Modal } from './Modal'
import { Button } from './ui/Button'
import { useToast } from './ui/useToast'

interface TreatmentsDialogProps {
  open: boolean
  onClose: () => void
  treatments: Treatment[]
  onChange: (treatments: Treatment[]) => void
}

export function TreatmentsDialog({ open, onClose, treatments, onChange }: TreatmentsDialogProps) {
  const toast = useToast()
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
    toast.push({ tone: 'success', title: 'Tratamento adicionado', description: treatment.name })
    setName('')
    setPrice(0)
    setCost(0)
    setError(undefined)
  }

  function handleRemove(treatment: Treatment) {
    onChange(treatments.filter((t) => t.id !== treatment.id))
    toast.push({ tone: 'info', title: 'Tratamento excluído', description: treatment.name })
  }

  return (
    <Modal open={open} title="Tratamentos cadastrados" onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-5">
        <p className="text-xs text-muted-foreground">
          Os tratamentos cadastrados ficam salvos somente neste navegador.
        </p>

        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
          {treatments.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">Nenhum tratamento cadastrado.</li>
          )}
          {treatments.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-cyan">
                  <ClipboardList className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="num text-xs text-muted-foreground">
                    {formatCurrency(t.price)} · custo {formatCurrency(t.cost)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Excluir ${t.name}`}
                onClick={() => handleRemove(t)}
                className="hover:text-danger"
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-surface-2/50 p-4">
          <h3 className="text-sm font-semibold">Adicionar tratamento</h3>

          <FormField label="Nome">
            {({ inputId }) => (
              <input
                id={inputId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <FormField label="Valor">
              {({ inputId }) => <MoneyInput id={inputId} value={price} onChange={setPrice} />}
            </FormField>
            <FormField label="Custo direto">
              {({ inputId }) => <MoneyInput id={inputId} value={cost} onChange={setCost} />}
            </FormField>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-danger">
              {error}
            </p>
          )}

          <Button size="lg" onClick={handleAdd}>
            <Plus aria-hidden />
            Adicionar tratamento
          </Button>
        </div>
      </div>
    </Modal>
  )
}
