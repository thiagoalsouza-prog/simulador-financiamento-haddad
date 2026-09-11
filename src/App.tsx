import { useEffect, useMemo, useState } from 'react'
import { savePatient, type PatientRecord, type SimulationSnapshot } from './api/patients'
import { CommercialResult } from './components/CommercialResult'
import { Header } from './components/Header'
import { ManagerAnalysis } from './components/ManagerAnalysis'
import { PatientsPage } from './components/PatientsPage'
import { ProposalDialog } from './components/ProposalDialog'
import { RiskMessageDialog } from './components/RiskMessageDialog'
import { RiskSettingsDialog } from './components/RiskSettingsDialog'
import { ScenarioComparison } from './components/ScenarioComparison'
import { SimulationForm, type SaveStatus } from './components/SimulationForm'
import { TreatmentsDialog } from './components/TreatmentsDialog'
import type { Scenario, SimulationMode, SimulationParams } from './finance/types'
import { runSimulation } from './finance/simulate'
import { validatePatientInfo, validateSimulationParams } from './finance/validate'
import { loadRiskSettings, saveRiskSettings } from './storage/riskSettings'
import { loadTheme, saveTheme, type Theme } from './storage/theme'
import { loadTreatments, saveTreatments } from './storage/treatments'
import { isValidPhone } from './utils/phone'

const AUTOSAVE_DELAY_MS = 900

const MAX_SCENARIOS = 3

function App() {
  const [showPatientsPage, setShowPatientsPage] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => loadTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  function handleToggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [savedIdentity, setSavedIdentity] = useState<{ name: string; phone: string } | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | undefined>()

  const patientSaved =
    savedIdentity !== null &&
    savedIdentity.name === patientName.trim() &&
    savedIdentity.phone === patientPhone

  const [treatments, setTreatments] = useState(() => loadTreatments())
  const [riskSettings, setRiskSettings] = useState(() => loadRiskSettings())

  const [treatmentId, setTreatmentId] = useState('custom')
  const [treatmentValue, setTreatmentValue] = useState(14800)
  const [directCost, setDirectCost] = useState(6000)
  const [downPayment, setDownPayment] = useState(2500)
  const [monthlyRatePct, setMonthlyRatePct] = useState(() => loadRiskSettings().defaultMonthlyRatePct)
  const [mode, setMode] = useState<SimulationMode>('byTerm')
  const [installments, setInstallments] = useState(() => loadRiskSettings().defaultInstallments)
  const [maxInstallment, setMaxInstallment] = useState(1000)

  const [scenarios, setScenarios] = useState<Scenario[]>([])

  const [proposalOpen, setProposalOpen] = useState(false)
  const [riskMessageOpen, setRiskMessageOpen] = useState(false)
  const [treatmentsOpen, setTreatmentsOpen] = useState(false)
  const [riskSettingsOpen, setRiskSettingsOpen] = useState(false)

  const params: SimulationParams = useMemo(
    () => ({
      treatmentValue,
      directCost,
      downPayment,
      monthlyRatePct,
      mode,
      installments: mode === 'byTerm' ? installments : undefined,
      maxInstallment: mode === 'byInstallment' ? maxInstallment : undefined,
    }),
    [treatmentValue, directCost, downPayment, monthlyRatePct, mode, installments, maxInstallment],
  )

  const patientErrors = useMemo(
    () => validatePatientInfo({ patientName, patientPhone, cpf }),
    [patientName, patientPhone, cpf],
  )
  const simulationErrors = useMemo(() => validateSimulationParams(params), [params])
  const errors = useMemo(
    () => ({ ...simulationErrors, ...patientErrors }),
    [simulationErrors, patientErrors],
  )
  const treatmentReady = Object.keys(simulationErrors).length === 0
  const patientFieldsValid = Object.keys(patientErrors).length === 0
  const canCompute = treatmentReady && patientFieldsValid && patientSaved

  const outcome = useMemo(() => runSimulation(params, riskSettings), [params, riskSettings])

  const treatmentName = treatments.find((t) => t.id === treatmentId)?.name ?? 'Personalizado'

  const simulationSnapshot: SimulationSnapshot | null = useMemo(() => {
    if (!treatmentReady || !outcome.feasible) return null
    return {
      tratamentoNome: treatmentName,
      valorTratamento: treatmentValue,
      entrada: downPayment,
      jurosMensalPct: monthlyRatePct,
      modo: mode,
      parcelas: outcome.installmentsCount,
      valorParcela: outcome.installmentValue,
      totalReceber: outcome.totalReceived,
    }
  }, [treatmentReady, outcome, treatmentName, treatmentValue, downPayment, monthlyRatePct, mode])

  async function handleSavePatient() {
    if (!patientName.trim() || !isValidPhone(patientPhone)) {
      setSaveStatus('error')
      setSaveError('Informe nome completo e um telefone válido com DDD.')
      return
    }

    setSaveStatus('saving')
    setSaveError(undefined)

    try {
      await savePatient(patientName.trim(), patientPhone, cpf, simulationSnapshot)
      setSaveStatus('success')
      setSavedIdentity({ name: patientName.trim(), phone: patientPhone })
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Não foi possível salvar o paciente.')
    }
  }

  useEffect(() => {
    if (!patientSaved || !simulationSnapshot) return

    const handle = setTimeout(() => {
      setSaveStatus('saving')
      setSaveError(undefined)
      savePatient(patientName.trim(), patientPhone, cpf, simulationSnapshot)
        .then(() => {
          setSaveStatus('success')
          setTimeout(() => setSaveStatus('idle'), 2000)
        })
        .catch((err: unknown) => {
          setSaveStatus('error')
          setSaveError(err instanceof Error ? err.message : 'Não foi possível salvar a simulação.')
        })
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(handle)
  }, [patientSaved, simulationSnapshot, patientName, patientPhone, cpf])

  function handleSelectTreatment(id: string) {
    setTreatmentId(id)
    if (id === 'custom') return
    const treatment = treatments.find((t) => t.id === id)
    if (treatment) {
      setTreatmentValue(treatment.price)
      setDirectCost(treatment.cost)
    }
  }

  function handleEditPatient(patient: PatientRecord) {
    const name = patient.nome.trim()
    const phone = patient.telefone

    setPatientName(name)
    setPatientPhone(phone)
    setCpf(patient.cpf ?? '')
    setSavedIdentity({ name, phone })

    const sim = patient.simulacao
    if (sim) {
      const matchedTreatment = treatments.find((t) => t.name === sim.tratamentoNome)
      setTreatmentId(matchedTreatment ? matchedTreatment.id : 'custom')
      setTreatmentValue(sim.valorTratamento)
      if (matchedTreatment) setDirectCost(matchedTreatment.cost)
      setDownPayment(sim.entrada)
      setMonthlyRatePct(sim.jurosMensalPct)
      setMode('byTerm')
      setInstallments(sim.parcelas)
    }

    setShowPatientsPage(false)
  }

  function handleChangeTreatments(next: typeof treatments) {
    setTreatments(next)
    saveTreatments(next)
    if (treatmentId !== 'custom' && !next.some((t) => t.id === treatmentId)) {
      setTreatmentId('custom')
    }
  }

  function handleChangeRiskSettings(next: typeof riskSettings) {
    setRiskSettings(next)
    saveRiskSettings(next)
  }

  const blockedMessage =
    !treatmentReady || !patientFieldsValid
      ? 'Preencha nome e telefone do paciente e os dados do tratamento para calcular a condição de pagamento.'
      : !patientSaved
        ? 'Clique em "Salvar paciente" para liberar o cálculo da condição de pagamento.'
        : undefined

  function handleAddScenario() {
    if (!canCompute || !outcome.feasible) return
    const scenario: Scenario = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: `Cenário ${scenarios.length + 1}`,
      params,
      outcome,
    }
    setScenarios((prev) => {
      const next = [...prev, scenario]
      return next.length > MAX_SCENARIOS ? next.slice(next.length - MAX_SCENARIOS) : next
    })
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header
        onOpenTreatments={() => setTreatmentsOpen(true)}
        onOpenRiskSettings={() => setRiskSettingsOpen(true)}
        onOpenPatients={() => setShowPatientsPage(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {showPatientsPage ? (
        <PatientsPage onBack={() => setShowPatientsPage(false)} onEdit={handleEditPatient} />
      ) : (
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start">
          <div className="lg:sticky lg:top-24 lg:w-[380px] lg:shrink-0">
            <SimulationForm
              patientName={patientName}
              onPatientNameChange={setPatientName}
              patientPhone={patientPhone}
              onPatientPhoneChange={setPatientPhone}
              cpf={cpf}
              onCpfChange={setCpf}
              treatments={treatments}
              treatmentId={treatmentId}
              onSelectTreatment={handleSelectTreatment}
              treatmentValue={treatmentValue}
              onTreatmentValueChange={setTreatmentValue}
              directCost={directCost}
              onDirectCostChange={setDirectCost}
              downPayment={downPayment}
              onDownPaymentChange={setDownPayment}
              monthlyRatePct={monthlyRatePct}
              onMonthlyRateChange={setMonthlyRatePct}
              mode={mode}
              onModeChange={setMode}
              installments={installments}
              onInstallmentsChange={setInstallments}
              maxInstallment={maxInstallment}
              onMaxInstallmentChange={setMaxInstallment}
              errors={errors}
              infeasibleMessage={mode === 'byInstallment' ? outcome.infeasibleMessage : undefined}
              patientSaved={patientSaved}
              saveStatus={saveStatus}
              saveError={saveError}
              onSavePatient={handleSavePatient}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <CommercialResult
              outcome={outcome}
              downPayment={downPayment}
              canCompute={canCompute}
              blockedMessage={blockedMessage}
              onGenerateProposal={() => setProposalOpen(true)}
              onCompareScenario={handleAddScenario}
            />

            {canCompute && outcome.feasible && (
              <ManagerAnalysis
                outcome={outcome}
                directCost={directCost}
                downPayment={downPayment}
                onOpenPatients={() => setShowPatientsPage(true)}
                onOpenRiskMessage={() => setRiskMessageOpen(true)}
              />
            )}

            <ScenarioComparison scenarios={scenarios} onClear={() => setScenarios([])} />
          </div>
        </main>
      )}

      <ProposalDialog
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
        patientName={patientName}
        treatmentValue={treatmentValue}
        downPayment={downPayment}
        installmentsCount={outcome.installmentsCount}
        installmentValue={outcome.installmentValue}
        totalReceived={outcome.totalReceived}
        monthlyRatePct={monthlyRatePct}
      />

      {canCompute && outcome.feasible && (
        <RiskMessageDialog
          open={riskMessageOpen}
          onClose={() => setRiskMessageOpen(false)}
          patientName={patientName}
          treatmentValue={treatmentValue}
          downPayment={downPayment}
          installmentsCount={outcome.installmentsCount}
          installmentValue={outcome.installmentValue}
          totalReceived={outcome.totalReceived}
          monthlyRatePct={monthlyRatePct}
          directCost={directCost}
          managerialResult={outcome.managerialResult}
          marginPct={outcome.marginPct}
          riskLevel={outcome.risk.level}
          riskAlerts={outcome.risk.alerts}
          costRecovery={outcome.costRecovery}
          principalRecovery={outcome.principalRecovery}
          principal={outcome.principal}
        />
      )}

      <TreatmentsDialog
        open={treatmentsOpen}
        onClose={() => setTreatmentsOpen(false)}
        treatments={treatments}
        onChange={handleChangeTreatments}
      />

      <RiskSettingsDialog
        key={riskSettingsOpen ? 'open' : 'closed'}
        open={riskSettingsOpen}
        onClose={() => setRiskSettingsOpen(false)}
        settings={riskSettings}
        onChange={handleChangeRiskSettings}
      />
    </div>
  )
}

export default App
