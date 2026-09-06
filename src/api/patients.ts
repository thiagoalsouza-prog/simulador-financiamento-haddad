export interface PatientRecord {
  id: number
  nome: string
  telefone: string
  criado_em: string
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? fallback
  } catch {
    return fallback
  }
}

/** Salva nome e telefone do paciente no banco de dados. Ação explícita do usuário. */
export async function savePatient(name: string, phoneDigits: string): Promise<PatientRecord> {
  const response = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone: phoneDigits }),
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
