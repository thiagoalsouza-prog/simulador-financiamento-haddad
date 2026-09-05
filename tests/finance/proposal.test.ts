import { describe, expect, it } from 'vitest'
import { buildProposalText, buildWhatsAppUrl } from '../../src/finance/proposal'

const baseInput = {
  patientName: 'Mariana Silva',
  treatmentValue: 14800,
  downPayment: 2500,
  installmentsCount: 18,
  installmentValue: 932.55,
  totalReceived: 19285.85,
  monthlyRatePct: 3.5,
  hideInterest: false,
}

describe('buildProposalText', () => {
  it('cenário 9 — nunca contém dados gerenciais, CPF ou risco', () => {
    const text = buildProposalText(baseInput)

    const forbidden = [
      '123.456.789-00',
      'CPF',
      'custo',
      'Custo',
      'margem',
      'Margem',
      'resultado',
      'Resultado',
      'recuperação',
      'Recuperação',
      'risco',
      'Risco',
      'prejuízo',
      'saldo devedor',
    ]

    for (const term of forbidden) {
      expect(text).not.toContain(term)
    }
  })

  it('cenário 10 — funciona sem nome do paciente', () => {
    const text = buildProposalText({ ...baseInput, patientName: '' })
    expect(text.startsWith('Olá! Tudo bem?')).toBe(true)
    expect(text).not.toContain('Mariana')
  })

  it('inclui saudação personalizada quando há nome', () => {
    const text = buildProposalText(baseInput)
    expect(text.startsWith('Olá, Mariana Silva! Tudo bem?')).toBe(true)
  })

  it('omite a taxa de juros quando "ocultar juros" está ativo', () => {
    const withInterest = buildProposalText(baseInput)
    const withoutInterest = buildProposalText({ ...baseInput, hideInterest: true })

    expect(withInterest).toContain('Taxa da condição')
    expect(withoutInterest).not.toContain('Taxa da condição')
  })

  it('inclui os dados comerciais essenciais', () => {
    const text = buildProposalText(baseInput)
    expect(text).toContain('Valor do tratamento')
    expect(text).toContain('Entrada')
    expect(text).toContain('18 parcelas')
    expect(text).toContain('Total da condição')
  })
})

describe('buildWhatsAppUrl', () => {
  it('gera uma URL de compartilhamento do WhatsApp com o texto codificado', () => {
    const url = buildWhatsAppUrl('Olá! Tudo bem?')
    expect(url).toBe('https://wa.me/?text=Ol%C3%A1!%20Tudo%20bem%3F')
  })
})
