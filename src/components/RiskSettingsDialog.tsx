import { useState } from 'react'
import type { RiskSettings } from '../finance/types'
import { FormField } from './FormField'
import { Modal } from './Modal'

interface RiskSettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: RiskSettings
  onChange: (settings: RiskSettings) => void
}

export function RiskSettingsDialog({ open, onClose, settings, onChange }: RiskSettingsDialogProps) {
  const [draft, setDraft] = useState(settings)

  function handleSave() {
    onChange(draft)
    onClose()
  }

  return (
    <Modal open={open} title="Política de risco" onClose={onClose} maxWidthClassName="max-w-md">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted">
          Esses parâmetros ficam salvos somente neste navegador e definem quando uma condição é
          classificada como saudável, de risco moderado ou elevado.
        </p>

        <FormField label="Prazo de atenção (meses)">
          {({ inputId }) => (
            <input
              id={inputId}
              type="number"
              min={1}
              max={120}
              value={draft.attentionTermMonths}
              onChange={(e) => setDraft({ ...draft, attentionTermMonths: Number(e.target.value) || 0 })}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            />
          )}
        </FormField>

        <FormField label="Margem mínima (%)">
          {({ inputId }) => (
            <input
              id={inputId}
              type="number"
              min={0}
              max={100}
              value={draft.minMarginPct}
              onChange={(e) => setDraft({ ...draft, minMarginPct: Number(e.target.value) || 0 })}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            />
          )}
        </FormField>

        <FormField label="Entrada mínima (%)">
          {({ inputId }) => (
            <input
              id={inputId}
              type="number"
              min={0}
              max={100}
              value={draft.minDownPaymentPct}
              onChange={(e) => setDraft({ ...draft, minDownPaymentPct: Number(e.target.value) || 0 })}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            />
          )}
        </FormField>

        <FormField label="Juros mínimos (% ao mês)">
          {({ inputId }) => (
            <input
              id={inputId}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={draft.minMonthlyRatePct}
              onChange={(e) => setDraft({ ...draft, minMonthlyRatePct: Number(e.target.value) || 0 })}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            />
          )}
        </FormField>

        <FormField label="Juros máximos (% ao mês)">
          {({ inputId }) => (
            <input
              id={inputId}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={draft.maxMonthlyRatePct}
              onChange={(e) => setDraft({ ...draft, maxMonthlyRatePct: Number(e.target.value) || 0 })}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            />
          )}
        </FormField>

        <hr className="border-border" />

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
            Valores padrão do simulador
          </h3>
          <p className="mt-1 text-xs text-muted">
            Usados para preencher uma nova simulação ao abrir o sistema.
          </p>
        </div>

        <FormField label="Número de parcelas padrão">
          {({ inputId }) => (
            <input
              id={inputId}
              type="number"
              min={1}
              max={120}
              step={1}
              value={draft.defaultInstallments}
              onChange={(e) => setDraft({ ...draft, defaultInstallments: Number(e.target.value) || 0 })}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            />
          )}
        </FormField>

        <FormField label="Taxa de juros padrão (% ao mês)">
          {({ inputId }) => (
            <input
              id={inputId}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={draft.defaultMonthlyRatePct}
              onChange={(e) => setDraft({ ...draft, defaultMonthlyRatePct: Number(e.target.value) || 0 })}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            />
          )}
        </FormField>

        <button
          type="button"
          onClick={handleSave}
          className="mt-2 flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-light"
        >
          Salvar parâmetros
        </button>
      </div>
    </Modal>
  )
}
