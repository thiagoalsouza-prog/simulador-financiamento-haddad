import { useState } from 'react'
import type { RiskSettings } from '../finance/types'
import { FormField } from './FormField'
import { Modal } from './Modal'
import { Button } from './ui/Button'

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
        <p className="text-xs text-muted-foreground">
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
              className="field num"
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Margem mínima (%)">
            {({ inputId }) => (
              <input
                id={inputId}
                type="number"
                min={0}
                max={100}
                value={draft.minMarginPct}
                onChange={(e) => setDraft({ ...draft, minMarginPct: Number(e.target.value) || 0 })}
                className="field num"
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
                className="field num"
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
                className="field num"
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
                className="field num"
              />
            )}
          </FormField>
        </div>

        <hr className="border-border" />

        <div>
          <h3 className="eyebrow">Valores padrão do simulador</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Usados para preencher uma nova simulação ao abrir o sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="field num"
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
                className="field num"
              />
            )}
          </FormField>
        </div>

        <Button size="lg" onClick={handleSave} className="mt-2 w-full">
          Salvar parâmetros
        </Button>
      </div>
    </Modal>
  )
}
