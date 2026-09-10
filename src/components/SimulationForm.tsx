import { Check, Loader2, UserPlus } from 'lucide-react'
import type { SimulationMode, Treatment } from '../finance/types'
import type { ValidationErrors } from '../finance/validate'
import { maskCpf, sanitizeCpfInput } from '../utils/cpf'
import { maskPhone, sanitizePhoneInput } from '../utils/phone'
import { FormField } from './FormField'
import { MoneyInput } from './MoneyInput'
import { PercentInput } from './PercentInput'

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

interface SimulationFormProps {
  patientName: string
  onPatientNameChange: (value: string) => void
  patientPhone: string
  onPatientPhoneChange: (value: string) => void
  cpf: string
  onCpfChange: (value: string) => void
  treatments: Treatment[]
  treatmentId: string
  onSelectTreatment: (id: string) => void
  treatmentValue: number
  onTreatmentValueChange: (value: number) => void
  directCost: number
  onDirectCostChange: (value: number) => void
  downPayment: number
  onDownPaymentChange: (value: number) => void
  monthlyRatePct: number
  onMonthlyRateChange: (value: number) => void
  mode: SimulationMode
  onModeChange: (mode: SimulationMode) => void
  installments: number
  onInstallmentsChange: (value: number) => void
  maxInstallment: number
  onMaxInstallmentChange: (value: number) => void
  errors: ValidationErrors
  infeasibleMessage?: string
  patientSaved: boolean
  saveStatus: SaveStatus
  saveError?: string
  onSavePatient: () => void
}

export function SimulationForm({
  patientName,
  onPatientNameChange,
  patientPhone,
  onPatientPhoneChange,
  cpf,
  onCpfChange,
  treatments,
  treatmentId,
  onSelectTreatment,
  treatmentValue,
  onTreatmentValueChange,
  directCost,
  onDirectCostChange,
  downPayment,
  onDownPaymentChange,
  monthlyRatePct,
  onMonthlyRateChange,
  mode,
  onModeChange,
  installments,
  onInstallmentsChange,
  maxInstallment,
  onMaxInstallmentChange,
  errors,
  infeasibleMessage,
  patientSaved,
  saveStatus,
  saveError,
  onSavePatient,
}: SimulationFormProps) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
          Dados do paciente
        </h2>

        <FormField label="Nome do paciente" error={errors.patientName}>
          {({ inputId, describedBy }) => (
            <input
              id={inputId}
              type="text"
              autoComplete="off"
              placeholder="Ex.: Mariana Silva"
              value={patientName}
              aria-describedby={describedBy}
              aria-invalid={!!errors.patientName || undefined}
              onChange={(e) => onPatientNameChange(e.target.value)}
              className={`min-h-11 w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary ${
                errors.patientName ? 'border-danger' : 'border-border'
              }`}
            />
          )}
        </FormField>

        <FormField label="Telefone" error={errors.patientPhone}>
          {({ inputId, describedBy }) => (
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="(00) 00000-0000"
              value={maskPhone(patientPhone)}
              aria-describedby={describedBy}
              aria-invalid={!!errors.patientPhone || undefined}
              onChange={(e) => onPatientPhoneChange(sanitizePhoneInput(e.target.value))}
              className={`min-h-11 w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary ${
                errors.patientPhone ? 'border-danger' : 'border-border'
              }`}
            />
          )}
        </FormField>

        <FormField label="CPF" error={errors.cpf}>
          {({ inputId, describedBy }) => (
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={maskCpf(cpf)}
              aria-describedby={describedBy}
              aria-invalid={!!errors.cpf || undefined}
              onChange={(e) => onCpfChange(sanitizeCpfInput(e.target.value))}
              className={`min-h-11 w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary ${
                errors.cpf ? 'border-danger' : 'border-border'
              }`}
            />
          )}
        </FormField>

        <button
          type="button"
          onClick={onSavePatient}
          disabled={saveStatus === 'saving'}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveStatus === 'saving' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saveStatus === 'success' ? (
            <Check size={16} className="text-success" />
          ) : (
            <UserPlus size={16} />
          )}
          {saveStatus === 'success' ? 'Paciente salvo ✓' : 'Salvar paciente'}
        </button>

        {saveStatus === 'error' && saveError && (
          <p role="alert" className="text-xs font-medium text-danger">
            {saveError}
          </p>
        )}

        <p className="text-xs text-muted">
          {patientSaved
            ? 'Paciente salvo. Alterações na simulação são salvas automaticamente a partir de agora.'
            : 'Nome, telefone e CPF são obrigatórios. Clique em "Salvar paciente" para liberar o cálculo da simulação.'}{' '}
          Nome, telefone, CPF e a simulação atual são gravados no banco de dados — o CPF nunca aparece
          na proposta enviada ao paciente. Ao editar um paciente já salvo, o CPF volta preenchido
          automaticamente. A busca fica disponível na área gerencial.
        </p>
      </section>

      <hr className="border-border" />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
          Dados do tratamento
        </h2>

        <FormField label="Tratamento">
          {({ inputId, describedBy }) => (
            <select
              id={inputId}
              value={treatmentId}
              aria-describedby={describedBy}
              onChange={(e) => onSelectTreatment(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary"
            >
              <option value="custom">Personalizado</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Valor do tratamento" error={errors.treatmentValue}>
          {({ inputId, describedBy }) => (
            <MoneyInput
              id={inputId}
              value={treatmentValue}
              onChange={onTreatmentValueChange}
              describedBy={describedBy}
              invalid={!!errors.treatmentValue}
            />
          )}
        </FormField>

        <FormField
          label="Custo direto"
          error={errors.directCost}
          hint="Informação interna. Nunca aparece na proposta."
        >
          {({ inputId, describedBy }) => (
            <MoneyInput
              id={inputId}
              value={directCost}
              onChange={onDirectCostChange}
              describedBy={describedBy}
              invalid={!!errors.directCost}
            />
          )}
        </FormField>

        <FormField label="Entrada" error={errors.downPayment}>
          {({ inputId, describedBy }) => (
            <MoneyInput
              id={inputId}
              value={downPayment}
              onChange={onDownPaymentChange}
              describedBy={describedBy}
              invalid={!!errors.downPayment}
            />
          )}
        </FormField>

        <FormField label="Juros ao mês" error={errors.monthlyRatePct}>
          {({ inputId, describedBy }) => (
            <PercentInput
              id={inputId}
              value={monthlyRatePct}
              onChange={onMonthlyRateChange}
              describedBy={describedBy}
              invalid={!!errors.monthlyRatePct}
            />
          )}
        </FormField>
      </section>

      <hr className="border-border" />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">
          Modo de simulação
        </h2>

        <div
          role="radiogroup"
          aria-label="Modo de simulação"
          className="flex rounded-full border border-border bg-background p-1 text-sm"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'byTerm'}
            onClick={() => onModeChange('byTerm')}
            className={`flex-1 rounded-full px-3 py-2 font-medium transition ${
              mode === 'byTerm' ? 'bg-primary text-white shadow-soft' : 'text-muted hover:text-text'
            }`}
          >
            Por prazo
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'byInstallment'}
            onClick={() => onModeChange('byInstallment')}
            className={`flex-1 rounded-full px-3 py-2 font-medium transition ${
              mode === 'byInstallment' ? 'bg-primary text-white shadow-soft' : 'text-muted hover:text-text'
            }`}
          >
            Por parcela
          </button>
        </div>

        {mode === 'byTerm' ? (
          <FormField label="Número de parcelas" error={errors.installments} hint="Entre 1 e 120 parcelas.">
            {({ inputId, describedBy }) => (
              <input
                id={inputId}
                type="number"
                min={1}
                max={120}
                step={1}
                value={installments}
                aria-describedby={describedBy}
                aria-invalid={!!errors.installments || undefined}
                onChange={(e) => onInstallmentsChange(parseInt(e.target.value, 10) || 0)}
                className={`min-h-11 w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary ${
                  errors.installments ? 'border-danger' : 'border-border'
                }`}
              />
            )}
          </FormField>
        ) : (
          <FormField
            label="Parcela máxima do paciente"
            error={errors.maxInstallment ?? infeasibleMessage}
          >
            {({ inputId, describedBy }) => (
              <MoneyInput
                id={inputId}
                value={maxInstallment}
                onChange={onMaxInstallmentChange}
                describedBy={describedBy}
                invalid={!!errors.maxInstallment || !!infeasibleMessage}
              />
            )}
          </FormField>
        )}
      </section>
    </div>
  )
}
