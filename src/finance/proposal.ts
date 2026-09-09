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
  const greeting = name ? `Olá, ${name}! Tudo bem? 😊` : 'Olá! Tudo bem? 😊'

  const lines = [
    greeting,
    '',
    'Preparamos uma condição especial para facilitar o início do seu tratamento na Clínica Haddad, com *parcelamento direto no boleto*:',
    '',
    `*Valor do tratamento:* ${formatCurrency(input.treatmentValue)}`,
    `*Valor inicial:* ${formatCurrency(input.downPayment)}`,
    `*Parcelamento:* ${input.installmentsCount}x de ${formatCurrency(input.installmentValue)} no boleto`,
    '',
    `*Total da condição:* ${formatCurrency(input.totalReceived)}`,
  ]

  if (!input.hideInterest) {
    lines.push(`*Taxa de financiamento:* ${formatPercent(input.monthlyRatePct, 2)} ao mês`)
  }

  lines.push(
    '',
    'Essa opção permite que você realize seu tratamento agora e organize o pagamento ao longo dos próximos meses, sem comprometer o limite do cartão de crédito.',
    '',
    '*Essa condição fica boa para você iniciar seu tratamento?*',
  )

  return lines.join('\n')
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
