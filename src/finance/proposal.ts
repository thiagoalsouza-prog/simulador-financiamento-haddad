import { formatCurrency } from '../utils/currency'
import { formatPercent } from '../utils/numbers'

export interface ProposalInput {
  patientName: string
  treatmentValue: number
  downPayment: number
  installmentsCount: number
  installmentValue: number
  totalReceived: number
  monthlyRatePct: number
  hideInterest: boolean
}

/**
 * Gera o texto da proposta comercial enviada ao paciente. Deve conter
 * exclusivamente dados comerciais — nunca CPF, custo, margem, resultado,
 * parcela de recuperação, risco ou tabela de amortização.
 */
export function buildProposalText(input: ProposalInput): string {
  const name = input.patientName.trim()
  const greeting = name ? `Olá, ${name}! Tudo bem?` : 'Olá! Tudo bem?'

  const lines = [
    greeting,
    '',
    'Preparamos uma condição de pagamento para o seu tratamento na Clínica Haddad:',
    '',
    `• Valor do tratamento: ${formatCurrency(input.treatmentValue)}`,
    `• Entrada: ${formatCurrency(input.downPayment)}`,
    `• Saldo em ${input.installmentsCount} parcelas de ${formatCurrency(input.installmentValue)}`,
    `• Total da condição: ${formatCurrency(input.totalReceived)}`,
  ]

  if (!input.hideInterest) {
    lines.push(`• Taxa da condição: ${formatPercent(input.monthlyRatePct, 2)} ao mês`)
  }

  lines.push(
    '',
    'Esta é uma simulação e a condição poderá ser confirmada no momento da contratação. Podemos reservar essa opção para você?',
  )

  return lines.join('\n')
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
