import { describe, expect, it } from 'vitest'
import { buildRiskMessageText, type RiskMessageInput } from '../../src/finance/riskMessage'
import { formatCurrency } from '../../src/utils/currency'

const baseInput: RiskMessageInput = {
  patientName: 'Mariana Silva',
  treatmentValue: 14800,
  downPayment: 2500,
  installmentsCount: 18,
  installmentValue: 932.55,
  totalReceived: 19285.85,
  monthlyRatePct: 3.5,
  directCost: 6000,
  managerialResult: 13285.85,
  marginPct: 68.9,
  riskLevel: 'healthy',
  riskAlerts: [],
  principal: 12300,
  costRecovery: {
    covered: true,
    installment: 5,
    receivedAtRecovery: 8480.2,
  },
  principalRecovery: {
    covered: true,
    installment: 14,
    receivedAtRecovery: 14744.56,
  },
}

describe('buildRiskMessageText', () => {
  it('inclui os dados comerciais da simulação', () => {
    const text = buildRiskMessageText(baseInput)
    expect(text).toContain('Mariana Silva')
    expect(text).toContain('Valor do tratamento')
    expect(text).toContain(formatCurrency(14800))
    expect(text).toContain('Entrada')
    expect(text).toContain('18x de')
    expect(text).toContain('Taxa de juros')
  })

  it('inclui os dados gerenciais que nunca vão para a proposta', () => {
    const text = buildRiskMessageText(baseInput)
    expect(text).toContain('Custo direto')
    expect(text).toContain('Resultado da operação')
    expect(text).toContain('Margem sobre o total recebido')
    expect(text).toContain('Classificação de risco')
  })

  it('inclui os blocos de recuperação do custo e do valor principal', () => {
    const text = buildRiskMessageText(baseInput)

    expect(text).toContain('Recuperação do custo')
    expect(text).toContain('O CUSTO SERÁ COBERTO NA 5ª PARCELA')
    expect(text).toContain(`Entrada + parcelas somam ${formatCurrency(8480.2)}`)

    expect(text).toContain('Recuperação do valor principal')
    expect(text).toContain('O VALOR PRINCIPAL SERÁ COBERTO NA 14ª PARCELA')
    expect(text).toContain(`Entrada + parcelas somam ${formatCurrency(14744.56)}`)
  })

  it('mostra o valor que falta receber quando a entrada não cobre tudo', () => {
    const text = buildRiskMessageText(baseInput)
    expect(text).toContain('Falta receber nas parcelas:')
  })

  it('lista os alertas de risco quando existem', () => {
    const text = buildRiskMessageText({
      ...baseInput,
      riskLevel: 'high',
      riskAlerts: ['Margem abaixo do mínimo definido (30%).'],
    })
    expect(text).toContain('Margem abaixo do mínimo definido (30%).')
  })

  it('avisa quando não há alertas de risco', () => {
    const text = buildRiskMessageText(baseInput)
    expect(text).toContain('Nenhum alerta de risco identificado.')
  })

  it('sinaliza que o custo não é coberto quando a recuperação falha', () => {
    const text = buildRiskMessageText({
      ...baseInput,
      costRecovery: { covered: false, installment: null, receivedAtRecovery: 10000 },
    })
    expect(text).toContain('ATENÇÃO: OPERAÇÃO EM PREJUÍZO')
    expect(text).toContain('O RECEBIMENTO NÃO COBRE O CUSTO')
  })

  it('funciona sem nome do paciente', () => {
    const text = buildRiskMessageText({ ...baseInput, patientName: '' })
    expect(text).toContain('Paciente: Não informado')
  })
})
