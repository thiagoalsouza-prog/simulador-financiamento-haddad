import { describe, expect, it } from 'vitest'
import { buildAmortizationSchedule, findNominalCostRecovery } from '../../src/finance/amortization'
import { calculatePricePayment } from '../../src/finance/price'

describe('buildAmortizationSchedule', () => {
  it('cenário 8 — saldo final zero, amortizações somam o principal, sem saldo negativo', () => {
    const principal = 12300
    const rate = 0.035
    const months = 18
    const payment = calculatePricePayment(principal, rate, months)
    const schedule = buildAmortizationSchedule(principal, rate, months, payment)

    expect(schedule).toHaveLength(months)
    expect(schedule[schedule.length - 1].balance).toBe(0)

    const totalAmortization = schedule.reduce((sum, row) => sum + row.amortization, 0)
    expect(totalAmortization).toBeCloseTo(principal, 6)

    for (const row of schedule) {
      expect(row.amortization).toBeGreaterThanOrEqual(0)
      expect(row.balance).toBeGreaterThanOrEqual(0)
    }

    const lastRow = schedule[schedule.length - 1]
    const secondToLastBalance = schedule[schedule.length - 2].balance
    const expectedLastPayment = secondToLastBalance + secondToLastBalance * rate
    expect(lastRow.payment).toBeCloseTo(expectedLastPayment, 6)
  })

  it('funciona corretamente com juros zero', () => {
    const schedule = buildAmortizationSchedule(12000, 0, 12, 1000)
    expect(schedule.every((row) => row.interest === 0)).toBe(true)
    expect(schedule[schedule.length - 1].balance).toBe(0)
    const total = schedule.reduce((sum, row) => sum + row.amortization, 0)
    expect(total).toBeCloseTo(12000, 6)
  })
})

describe('findNominalCostRecovery', () => {
  it('cenário 5 — recuperação na 4ª parcela', () => {
    const principal = 12300
    const rate = 0.035
    const months = 18
    const payment = calculatePricePayment(principal, rate, months)
    const schedule = buildAmortizationSchedule(principal, rate, months, payment)

    const result = findNominalCostRecovery(6000, 2500, schedule)

    expect(result.covered).toBe(true)
    expect(result.installment).toBe(4)
    expect(result.receivedAtRecovery).toBeCloseTo(6230.19, 1)
    expect(result.receivedAtRecovery - 6000).toBeCloseTo(230.19, 1)
  })

  it('cenário 6 — custo coberto na entrada', () => {
    const schedule = buildAmortizationSchedule(8300, 0.035, 18, 500)
    const result = findNominalCostRecovery(6000, 6000, schedule)

    expect(result.covered).toBe(true)
    expect(result.installment).toBe(0)
    expect(result.receivedAtRecovery).toBe(6000)
  })

  it('cenário 7 — custo não recuperado', () => {
    // 18 parcelas fixas de R$ 900 contratadas — não é necessário que a
    // tabela amortize completamente para validar o fluxo de caixa nominal.
    const schedule = Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      payment: 900,
      interest: 0,
      amortization: 900,
      balance: 0,
    }))
    const result = findNominalCostRecovery(20000, 0, schedule)

    expect(result.covered).toBe(false)
    expect(result.installment).toBeNull()
    expect(result.receivedAtRecovery).toBeCloseTo(18 * 900, 6)
  })
})
