import { useEffect, useMemo, useState } from 'react'
import type { SimulationSnapshot } from './api/patients'
import { CommercialResult } from './components/CommercialResult'
import { Header } from './components/Header'
import { ManagerAnalysis } from './components/ManagerAnalysis'
import { PatientsPage } from './components/PatientsPage'
import { ProposalDialog } from './components/ProposalDialog'
import { RiskSettingsDialog } from './components/RiskSettingsDialog'
import { ScenarioComparison } from './components/ScenarioComparison'
import { SimulationForm } from './components/SimulationForm'
import { TreatmentsDialog } from './components/TreatmentsDialog'
import type { Scenario, SimulationMode, SimulationParams } from './finance/types'
import { runSimulation } from './finance/simulate'
import { validateSimulationParams } from './finance/validate'
import { loadRiskSettings, saveRiskSettings } from './storage/riskSettings'
import { loadTheme, saveTheme, type Theme } from './storage/theme'
import { loadTreatments, saveTreatments } from './storage/treatments'
import type { View } from './types'

const MAX_SCENARIOS = 3

function App() {
  const [view, setView] = useState<View>('commercial')
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

  const [treatments, setTreatments] = useState(() => loadTreatments())
  const [riskSettings, setRiskSettings] = useState(() => loadRiskSettings())

  const [treatmentId, setTreatmentId] = useState('custom')
  const [treatmentValue, setTreatmentValue] = useState(14800)
  const [directCost, setDirectCost] = useState(6000)
  const [downPayment, setDownPayment] = useState(2500)
  const [monthlyRatePct, setMonthlyRatePct] = useState(3.5)
  const [mode, setMode] = useState<SimulationMode>('byTerm')
  const [installments, setInstallments] = useState(18)
  const [maxInstallment, setMaxInstallment] = useState(1000)

  const [scenarios, setScenarios] = useState<Scenario[]>([])

  const [proposalOpen, setProposalOpen] = useState(false)
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

  const errors = useMemo(() => validateSimulationParams(params), [params])
  const canCompute = Object.keys(errors).length === 0

  const outcome = useMemo(() => runSimulation(params, riskSettings), [params, riskSettings])

  const treatmentName = treatments.find((t) => t.id === treatmentId)?.name ?? 'Personalizado'

  const simulationSnapshot: SimulationSnapshot | null = useMemo(() => {
    if (!canCompute || !outcome.feasible) return null
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
  }, [canCompute, outcome, treatmentName, treatmentValue, downPayment, monthlyRatePct, mode])

  function handleChangeView(next: View) {
    setView(next)
    setShowPatientsPage(false)
  }

  function handleSelectTreatment(id: string) {
    setTreatmentId(id)
    if (id === 'custom') return
    const treatment = treatments.find((t) => t.id === id)
    if (treatment) {
      setTreatmentValue(treatment.price)
      setDirectCost(treatment.cost)
    }
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
        view={view}
        onChangeView={handleChangeView}
        onOpenTreatments={() => setTreatmentsOpen(true)}
        onOpenRiskSettings={() => setRiskSettingsOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {showPatientsPage ? (
        <PatientsPage onBack={() => setShowPatientsPage(false)} />
      ) : (
        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start">
          <div className="lg:sticky lg:top-24 lg:w-[380px] lg:shrink-0">
            <SimulationForm
              view={view}
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
              simulationSnapshot={simulationSnapshot}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <CommercialResult
              outcome={outcome}
              downPayment={downPayment}
              canCompute={canCompute}
              onGenerateProposal={() => setProposalOpen(true)}
              onCompareScenario={handleAddScenario}
            />

            {view === 'manager' && canCompute && outcome.feasible && (
              <ManagerAnalysis
                outcome={outcome}
                directCost={directCost}
                downPayment={downPayment}
                onOpenPatients={() => setShowPatientsPage(true)}
              />
            )}

            <ScenarioComparison scenarios={scenarios} view={view} onClear={() => setScenarios([])} />
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
