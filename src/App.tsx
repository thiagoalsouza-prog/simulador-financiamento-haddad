import { Calculator, ClipboardList, ShieldCheck, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { savePatient, type PatientRecord, type SimulationSnapshot } from './api/patients'
import { CommercialResult } from './components/CommercialResult'
import { ManagerAnalysis } from './components/ManagerAnalysis'
import { PatientsPage } from './components/PatientsPage'
import { ProposalDialog } from './components/ProposalDialog'
import { RiskMessageDialog } from './components/RiskMessageDialog'
import { RiskSettingsDialog } from './components/RiskSettingsDialog'
import { ScenarioComparison } from './components/ScenarioComparison'
import { SimulationForm, type SaveStatus } from './components/SimulationForm'
import { TreatmentsDialog } from './components/TreatmentsDialog'
import { AppShell, type NavGroup } from './components/shell/AppShell'
import { PageHeader } from './components/ui/PageHeader'
import { ToastProvider } from './components/ui/Toast'
import { useToast } from './components/ui/useToast'
import type { Scenario, SimulationMode, SimulationParams } from './finance/types'
import { runSimulation } from './finance/simulate'
import { validatePatientInfo, validateSimulationParams } from './finance/validate'
import { loadRiskSettings, saveRiskSettings } from './storage/riskSettings'
import { applyTheme, loadTheme, saveTheme, type Theme } from './storage/theme'
import { loadTreatments, saveTreatments } from './storage/treatments'
import { isValidPhone } from './utils/phone'

const AUTOSAVE_DELAY_MS = 900

const MAX_SCENARIOS = 3

type Page = 'simulador' | 'pacientes'

function Simulator() {
  const toast = useToast()
  const [page, setPage] = useState<Page>('simulador')
  const [theme, setTheme] = useState<Theme>(() => loadTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function handleToggleTheme() {
    const next: Theme = theme === 'escuro' ? 'claro' : 'escuro'
    setTheme(next)
    saveTheme(next)
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
      toast.push({ tone: 'success', title: 'Paciente salvo', description: 'A simulação passa a ser salva automaticamente.' })
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

    setPage('simulador')
    toast.push({ tone: 'info', title: 'Paciente carregado para edição', description: 'Os dados salvos já estão no formulário.' })
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
    toast.push({ tone: 'success', title: 'Política de risco atualizada' })
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
    toast.push({ tone: 'success', title: 'Cenário adicionado à comparação' })
  }

  const openPatients = useCallback(() => setPage('pacientes'), [])

  const navGroups: NavGroup[] = [
    {
      title: 'Atendimento',
      items: [
        { id: 'simulador', label: 'Simulador', icon: Calculator, active: page === 'simulador', onSelect: () => setPage('simulador') },
        { id: 'pacientes', label: 'Pacientes salvos', icon: Users, active: page === 'pacientes', onSelect: openPatients },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        { id: 'tratamentos', label: 'Tratamentos cadastrados', icon: ClipboardList, onSelect: () => setTreatmentsOpen(true) },
        { id: 'risco', label: 'Política de risco', icon: ShieldCheck, onSelect: () => setRiskSettingsOpen(true) },
      ],
    },
  ]

  return (
    <AppShell
      groups={navGroups}
      theme={theme}
      onToggleTheme={handleToggleTheme}
      onSearchPatients={openPatients}
    >
      {page === 'pacientes' ? (
        <PatientsPage onBack={() => setPage('simulador')} onEdit={handleEditPatient} />
      ) : (
        <div className="enter">
          <PageHeader
            sobretitulo="Simulador de financiamento"
            titulo="Planejamento financeiro"
            descricao="Informe o paciente e o tratamento, salve o paciente e calcule a condição de pagamento com a análise gerencial."
          />

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <div className="xl:sticky xl:top-6 xl:-m-1 xl:max-h-[calc(100vh-3rem)] xl:w-[408px] xl:shrink-0 xl:overflow-y-auto xl:p-1">
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
                steps={[
                  { label: 'Nome e telefone do paciente', done: patientFieldsValid },
                  { label: 'Paciente salvo no sistema', done: patientSaved },
                  { label: 'Dados do tratamento', done: treatmentReady },
                ]}
                onGenerateProposal={() => setProposalOpen(true)}
                onCompareScenario={handleAddScenario}
              />

              {canCompute && outcome.feasible && (
                <ManagerAnalysis
                  outcome={outcome}
                  directCost={directCost}
                  downPayment={downPayment}
                  onOpenPatients={openPatients}
                  onOpenRiskMessage={() => setRiskMessageOpen(true)}
                />
              )}

              <ScenarioComparison scenarios={scenarios} onClear={() => setScenarios([])} />
            </div>
          </div>
        </div>
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
          creditCost={outcome.creditCost}
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
    </AppShell>
  )
}

function App() {
  return (
    <ToastProvider>
      <Simulator />
    </ToastProvider>
  )
}

export default App
