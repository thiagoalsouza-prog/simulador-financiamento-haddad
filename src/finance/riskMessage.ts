import type { CostRecoveryResult, RiskLevel } from './types'
import { formatCurrency } from '../utils/currency'
import { formatPercent } from '../utils/numbers'

export interface RiskMessageInput {
  patientName: string
  treatmentValue: number
  downPayment: number
  installmentsCount: number
  installmentValue: number
  totalReceived: number
  monthlyRatePct: number
  directCost: number
  managerialResult: number
  marginPct: number
  riskLevel: RiskLevel
  riskAlerts: string[]
  costRecovery: CostRecoveryResult
  principalRecovery: CostRecoveryResult
  principal: number
}

const RISK_LABEL: Record<RiskLevel, string> = {
  healthy: 'Condição saudável',
  moderate: 'Risco moderado',
  high: 'Risco elevado',
}

function buildSurgeryReleaseAlert(costRecovery: CostRecoveryResult, directCost: number): string[] {
  if (costRecovery.covered) {
    const isFromDownPaymentAlone = costRecovery.installment === 0
    const milestone = isFromDownPaymentAlone ? 'NA ENTRADA' : `NA ${costRecovery.installment}ª PARCELA`

    return [
      isFromDownPaymentAlone
        ? 'LIBERAÇÃO DA CIRURGIA: JÁ PODE SER LIBERADA'
        : `LIBERAÇÃO DA CIRURGIA: APÓS O PAGAMENTO DA ${costRecovery.installment}ª PARCELA`,
      '',
      '🟢 RECUPERAÇÃO DO CUSTO DIRETO',
      '',
      `CUSTO TOTALMENTE RECUPERADO ${milestone}`,
      '',
      `Entrada + parcelas recebidas: ${formatCurrency(costRecovery.receivedAtRecovery)}`,
      `Custo direto do tratamento: ${formatCurrency(directCost)}`,
      '',
      isFromDownPaymentAlone
        ? '✅ O custo direto do tratamento já está coberto pela entrada e a cirurgia pode ser liberada.'
        : `✅ A partir da ${costRecovery.installment}ª parcela paga, o custo direto do tratamento estará coberto e a cirurgia poderá ser liberada.`,
    ]
  }

  const stillMissing = Math.max(0, directCost - costRecovery.receivedAtRecovery)
  return [
    'LIBERAÇÃO DA CIRURGIA: NÃO LIBERAR SEM AVALIAÇÃO ADICIONAL',
    '',
    '🔴 RECUPERAÇÃO DO CUSTO DIRETO',
    '',
    'CUSTO NÃO SERÁ TOTALMENTE RECUPERADO NAS PARCELAS PREVISTAS',
    '',
    `Entrada + todas as parcelas recebidas: ${formatCurrency(costRecovery.receivedAtRecovery)}`,
    `Custo direto do tratamento: ${formatCurrency(directCost)}`,
    `Ainda faltará: ${formatCurrency(stillMissing)}`,
    '',
    '⚠️ O custo direto do tratamento não será totalmente coberto pelas parcelas previstas.',
  ]
}

function buildRecoveryBlock(
  recovery: CostRecoveryResult,
  target: number,
  downPayment: number,
  label: string,
  targetNoun: string,
  targetNounUpper: string,
  notCoveredTitle: string,
  notCoveredSubtitle: string,
): string[] {
  const amountMissingAfterDownPayment = Math.max(0, target - downPayment)

  if (recovery.covered) {
    const isFromDownPaymentAlone = recovery.installment === 0
    const lines = [
      label,
      isFromDownPaymentAlone
        ? `O ${targetNounUpper} JÁ É COBERTO PELA ENTRADA`
        : `O ${targetNounUpper} SERÁ COBERTO NA ${recovery.installment}ª PARCELA`,
      '',
      isFromDownPaymentAlone
        ? `Entrada de ${formatCurrency(downPayment)} já cobre o ${targetNoun} de ${formatCurrency(target)}.`
        : `Entrada + parcelas somam ${formatCurrency(recovery.receivedAtRecovery)}`,
    ]
    if (amountMissingAfterDownPayment > 0) {
      lines.push('', `Falta receber nas parcelas: ${formatCurrency(amountMissingAfterDownPayment)}`)
    }
    return lines
  }

  const stillMissing = Math.max(0, target - recovery.receivedAtRecovery)
  return [
    label,
    notCoveredTitle,
    notCoveredSubtitle,
    '',
    `Entrada + todas as parcelas somam ${formatCurrency(recovery.receivedAtRecovery)}. Ainda faltará ${formatCurrency(stillMissing)} após a última parcela.`,
  ]
}

/**
 * Gera o texto da mensagem de risco para uso interno da equipe — contém
 * custo, margem, resultado e recuperação, dados que nunca podem ir para a
 * proposta comercial enviada ao paciente.
 */
export function buildRiskMessageText(input: RiskMessageInput): string {
  const name = input.patientName.trim()

  const lines = [
    ...buildSurgeryReleaseAlert(input.costRecovery, input.directCost),
    '',
    '⚠️ MENSAGEM DE RISCO — USO INTERNO (NÃO ENVIAR AO PACIENTE)',
    '',
    `Paciente: ${name || 'Não informado'}`,
    '',
    `Valor do tratamento: ${formatCurrency(input.treatmentValue)}`,
    `Entrada: ${formatCurrency(input.downPayment)}`,
    `Parcelas: ${input.installmentsCount}x de ${formatCurrency(input.installmentValue)}`,
    `Total a receber: ${formatCurrency(input.totalReceived)}`,
    `Taxa de juros: ${formatPercent(input.monthlyRatePct, 2)} ao mês`,
    '',
    `Custo direto: ${formatCurrency(input.directCost)}`,
    `Resultado da operação: ${formatCurrency(input.managerialResult)}`,
    `Margem sobre o total recebido: ${formatPercent(input.marginPct, 1)}`,
    '',
    `Classificação de risco: ${RISK_LABEL[input.riskLevel]}`,
  ]

  if (input.riskAlerts.length > 0) {
    for (const alert of input.riskAlerts) {
      lines.push(`• ${alert}`)
    }
  } else {
    lines.push('Nenhum alerta de risco identificado.')
  }

  lines.push(
    '',
    ...buildRecoveryBlock(
      input.principalRecovery,
      input.principal,
      input.downPayment,
      'Recuperação do valor principal',
      'valor principal',
      'VALOR PRINCIPAL',
      'ATENÇÃO: SALDO FINANCIADO NÃO RECUPERADO',
      'O RECEBIMENTO NÃO COBRE O VALOR PRINCIPAL',
    ),
  )

  return lines.join('\n')
}
