import { Check, ChevronDown, Info, Loader2, SlidersHorizontal, Stethoscope, UserPlus, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { SimulationMode, Treatment } from '../finance/types'
import type { ValidationErrors } from '../finance/validate'
import { maskCpf, sanitizeCpfInput } from '../utils/cpf'
import { maskPhone, sanitizePhoneInput } from '../utils/phone'
import { FormField } from './FormField'
import { MoneyInput } from './MoneyInput'
import { PercentInput } from './PercentInput'
import { Alert } from './ui/Alert'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { SegmentedControl } from './ui/SegmentedControl'

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
  // erros do paciente só aparecem depois que o campo foi visitado ou que se tentou salvar (formulário limpo não nasce vermelho)
  const [touched, setTouched] = useState({ patientName: false, patientPhone: false, cpf: false })
  const [attemptedSave, setAttemptedSave] = useState(false)
  const touch = (field: keyof typeof touched) => setTouched((current) => (current[field] ? current : { ...current, [field]: true }))
  const patientError = (field: keyof typeof touched) => (touched[field] || attemptedSave ? errors[field] : undefined)

  return (
    <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
      <Card className="p-5">
        <CardHeader
          icon={UserRound}
          title="Dados do paciente"
          action={
            <Badge tom={patientSaved ? 'sucesso' : 'atencao'} ponto>
              {patientSaved ? 'Salvo' : 'Pendente'}
            </Badge>
          }
        />

        <div className="mt-4 flex flex-col gap-3.5">
          <FormField label="Nome do paciente" error={patientError('patientName')}>
            {({ inputId, describedBy }) => (
              <input
                id={inputId}
                type="text"
                autoComplete="off"
                placeholder="Ex.: Mariana Silva"
                value={patientName}
                aria-describedby={describedBy}
                aria-invalid={!!patientError('patientName') || undefined}
                onChange={(e) => onPatientNameChange(e.target.value)}
                onBlur={() => touch('patientName')}
                className="field"
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-3.5 min-[420px]:grid-cols-2">
            <FormField label="Telefone" error={patientError('patientPhone')}>
              {({ inputId, describedBy }) => (
                <input
                  id={inputId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="(00) 00000-0000"
                  value={maskPhone(patientPhone)}
                  aria-describedby={describedBy}
                  aria-invalid={!!patientError('patientPhone') || undefined}
                  onChange={(e) => onPatientPhoneChange(sanitizePhoneInput(e.target.value))}
                  onBlur={() => touch('patientPhone')}
                  className="field num"
                />
              )}
            </FormField>

            <FormField label="CPF (opcional)" error={patientError('cpf')}>
              {({ inputId, describedBy }) => (
                <input
                  id={inputId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={maskCpf(cpf)}
                  aria-describedby={describedBy}
                  aria-invalid={!!patientError('cpf') || undefined}
                  onChange={(e) => onCpfChange(sanitizeCpfInput(e.target.value))}
                  onBlur={() => touch('cpf')}
                  className="field num"
                />
              )}
            </FormField>
          </div>

          <Button
            variant={patientSaved && saveStatus !== 'saving' ? 'secondary' : 'outline'}
            size="lg"
            onClick={() => {
              setAttemptedSave(true)
              onSavePatient()
            }}
            disabled={saveStatus === 'saving'}
            className="w-full"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : saveStatus === 'success' ? (
              <Check className="text-success" aria-hidden />
            ) : (
              <UserPlus aria-hidden />
            )}
            {saveStatus === 'success' ? 'Paciente salvo ✓' : 'Salvar paciente'}
          </Button>

          {saveStatus === 'error' && saveError && (
            <Alert tone="danger" role="alert" className="py-2.5 text-xs">
              {saveError}
            </Alert>
          )}

          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-cyan" aria-hidden />
            <div className="min-w-0">
              <p>
                {patientSaved
                  ? 'Paciente salvo. Alterações na simulação são salvas automaticamente a partir de agora.'
                  : 'Nome e telefone são obrigatórios. Clique em "Salvar paciente" para liberar o cálculo da simulação.'}
              </p>
              <details className="group mt-1">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-foreground/80 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                  Como os dados são guardados
                  <ChevronDown
                    className="size-3.5 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-1">
                  Nome, telefone, CPF (quando informado) e a simulação atual são gravados no banco de dados
                  — o CPF nunca aparece na proposta enviada ao paciente. Ao editar um paciente já salvo, o
                  CPF volta preenchido automaticamente. A busca fica disponível na área gerencial.
                </p>
              </details>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader icon={Stethoscope} title="Dados do tratamento" />

        <div className="mt-4 flex flex-col gap-3.5">
          <FormField label="Tratamento">
            {({ inputId, describedBy }) => (
              <select
                id={inputId}
                value={treatmentId}
                aria-describedby={describedBy}
                onChange={(e) => onSelectTreatment(e.target.value)}
                className="field"
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

          <div className="grid grid-cols-1 gap-3.5 min-[420px]:grid-cols-2">
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
          </div>
        </div>
      </Card>

      <Card className="p-5 md:col-span-2 xl:col-span-1">
        <CardHeader icon={SlidersHorizontal} title="Modo de simulação" />

        <div className="mt-4 flex flex-col gap-3.5">
          <SegmentedControl
            ariaLabel="Modo de simulação"
            value={mode}
            onChange={onModeChange}
            options={[
              { value: 'byTerm', label: 'Por prazo' },
              { value: 'byInstallment', label: 'Por parcela' },
            ]}
          />

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
                  className="field num"
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
        </div>
      </Card>
    </div>
  )
}
