import { isValidCpf } from '../utils/cpf'
import { isValidPhone } from '../utils/phone'
import type { SimulationParams } from './types'

export type ValidationErrors = Partial<
  Record<
    | 'treatmentValue'
    | 'directCost'
    | 'downPayment'
    | 'monthlyRatePct'
    | 'installments'
    | 'maxInstallment'
    | 'patientName'
    | 'patientPhone'
    | 'cpf',
    string
  >
>

export interface PatientInfo {
  patientName: string
  patientPhone: string
  cpf: string
}

export function validatePatientInfo(patient: PatientInfo): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!patient.patientName.trim()) {
    errors.patientName = 'Informe o nome do paciente.'
  }

  if (!isValidPhone(patient.patientPhone)) {
    errors.patientPhone = 'Informe um telefone válido com DDD.'
  }

  if (!isValidCpf(patient.cpf)) {
    errors.cpf = 'Informe um CPF válido com 11 dígitos.'
  }

  return errors
}

export function validateSimulationParams(params: SimulationParams): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!Number.isFinite(params.treatmentValue) || params.treatmentValue <= 0) {
    errors.treatmentValue = 'Informe um valor de tratamento maior que zero.'
  }

  if (!Number.isFinite(params.directCost) || params.directCost < 0) {
    errors.directCost = 'O custo direto não pode ser negativo.'
  }

  if (!Number.isFinite(params.downPayment) || params.downPayment < 0) {
    errors.downPayment = 'A entrada não pode ser negativa.'
  } else if (params.downPayment > params.treatmentValue) {
    errors.downPayment = 'A entrada não pode ser maior que o valor do tratamento.'
  }

  if (!Number.isFinite(params.monthlyRatePct) || params.monthlyRatePct < 0) {
    errors.monthlyRatePct = 'A taxa de juros não pode ser negativa.'
  }

  if (params.mode === 'byTerm') {
    const n = params.installments ?? 0
    if (!Number.isInteger(n) || n < 1 || n > 120) {
      errors.installments = 'Informe um número de parcelas entre 1 e 120.'
    }
  } else {
    const max = params.maxInstallment ?? 0
    if (!Number.isFinite(max) || max <= 0) {
      errors.maxInstallment = 'Informe uma parcela máxima maior que zero.'
    }
  }

  return errors
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}
