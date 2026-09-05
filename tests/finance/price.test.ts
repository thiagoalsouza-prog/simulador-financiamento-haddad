import { describe, expect, it } from 'vitest'
import { calculatePricePayment } from '../../src/finance/price'

describe('calculatePricePayment', () => {
  it('cenário 1 — Price normal: 12300 a 3,5% em 18 meses', () => {
    const payment = calculatePricePayment(12300, 0.035, 18)
    expect(payment).toBeCloseTo(932.547142, 4)
    expect(payment).toBeCloseTo(932.55, 2)
  })

  it('cenário 2 — juros zero: 12000 em 12 meses', () => {
    const payment = calculatePricePayment(12000, 0, 12)
    expect(payment).toBeCloseTo(1000, 2)
  })

  it('retorna zero quando o principal é zero', () => {
    expect(calculatePricePayment(0, 0.035, 12)).toBe(0)
  })

  it('rejeita número de parcelas inválido', () => {
    expect(() => calculatePricePayment(1000, 0.02, 0)).toThrow()
    expect(() => calculatePricePayment(1000, 0.02, -1)).toThrow()
    expect(() => calculatePricePayment(1000, 0.02, 1.5)).toThrow()
  })

  it('rejeita principal ou taxa negativos', () => {
    expect(() => calculatePricePayment(-100, 0.02, 12)).toThrow()
    expect(() => calculatePricePayment(100, -0.02, 12)).toThrow()
  })
})
