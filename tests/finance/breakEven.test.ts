import { describe, expect, it } from 'vitest'
import { calculateTermByInstallment } from '../../src/finance/breakEven'

describe('calculateTermByInstallment', () => {
  it('cenário 3 — prazo pela parcela: 12300 a 3,5%, parcela máxima 1000', () => {
    const result = calculateTermByInstallment(12300, 0.035, 1000)
    expect(result.feasible).toBe(true)
    expect(result.months).toBe(17)
  })

  it('cenário 4 — parcela inviável: parcela menor que os juros do primeiro período', () => {
    const result = calculateTermByInstallment(12300, 0.035, 430)
    expect(result.firstPeriodInterest).toBeCloseTo(430.5, 2)
    expect(result.feasible).toBe(false)
    expect(result.reason).toBe('installmentTooLow')
    expect(result.months).toBeNull()
  })

  it('marca como inviável quando o prazo necessário ultrapassa 120 meses', () => {
    // Parcela acima dos juros do 1º período (R$ 1.000), mas insuficiente
    // para amortizar o saldo dentro do teto de 120 parcelas.
    const result = calculateTermByInstallment(100000, 0.01, 1005, 120)
    expect(result.feasible).toBe(false)
    expect(result.reason).toBe('exceedsMaxTerm')
  })

  it('funciona com juros iguais a zero', () => {
    const result = calculateTermByInstallment(12000, 0, 1000)
    expect(result.feasible).toBe(true)
    expect(result.months).toBe(12)
  })

  it('rejeita parcela máxima zero ou negativa', () => {
    expect(calculateTermByInstallment(1000, 0.02, 0).feasible).toBe(false)
    expect(calculateTermByInstallment(1000, 0.02, -10).feasible).toBe(false)
  })
})
