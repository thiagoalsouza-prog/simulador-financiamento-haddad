import type { SimulationMode } from '../finance/types'

export interface SimulationSnapshot {
  tratamentoNome: string
  valorTratamento: number
  entrada: number
  jurosMensalPct: number
  modo: SimulationMode
  parcelas: number
  valorParcela: number
  totalReceber: number
}

export interface PatientRecord {
  id: number
  nome: string
  telefone: string
  simulacao: SimulationSnapshot | null
  criado_em: string
  atualizado_em: string
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Salva nome, telefone e a simulação atual do paciente no banco de dados.
 * Ação explícita do usuário. Um novo "Salvar paciente" para o mesmo
 * nome+telefone sobrescreve a simulação anterior (mantém só a mais recente).
 */
export async function savePatient(
  name: string,
  phoneDigits: string,
  simulation: SimulationSnapshot | null,
): Promise<PatientRecord> {
  const response = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone: phoneDigits, simulation }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Não foi possível salvar o paciente.'))
  }

  return response.json()
}

/** Busca pacientes salvos por nome ou telefone. Usado apenas na área gerencial. */
export async function searchPatients(query: string): Promise<PatientRecord[]> {
  const response = await fetch(`/api/patients?q=${encodeURIComponent(query)}`)

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Não foi possível buscar pacientes.'))
  }

  return response.json()
}
