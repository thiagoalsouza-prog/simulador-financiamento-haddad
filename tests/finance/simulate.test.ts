import { describe, expect, it } from 'vitest'
import { runSimulation } from '../../src/finance/simulate'
import type { RiskSettings, SimulationParams } from '../../src/finance/types'

const riskSettings: RiskSettings = {
  attentionTermMonths: 24,
  minMarginPct: 30,
  minDownPaymentPct: 10,
  maxMonthlyRatePct: 5,
}

describe('runSimulation', () => {
  it('calcula o cenário padrão do simulador (modo por prazo)', () => {
    const params: SimulationParams = {
      treatmentValue: 14800,
      directCost: 6000,
      downPayment: 2500,
      monthlyRatePct: 3.5,
      mode: 'byTerm',
      installments: 18,
    }

    const outcome = runSimulation(params, riskSettings)

    expect(outcome.feasible).toBe(true)
    expect(outcome.principal).toBe(12300)
    expect(outcome.installmentValue).toBeCloseTo(932.547142, 4)
    expect(outcome.costRecovery.covered).toBe(true)
    expect(outcome.costRecovery.installment).toBe(4)
    expect(outcome.principalRecovery.covered).toBe(true)
    expect(outcome.principalRecovery.installment).toBe(11)
    expect(outcome.managerialResult).toBeGreaterThan(0)
    expect(outcome.risk.level).toBe('healthy')
  })

  it('modo por parcela recalcula a prestação Price para o prazo encontrado', () => {
    const params: SimulationParams = {
      treatmentValue: 14800,
      directCost: 6000,
      downPayment: 2500,
      monthlyRatePct: 3.5,
      mode: 'byInstallment',
      maxInstallment: 1000,
    }

    const outcome = runSimulation(params, riskSettings)

    expect(outcome.feasible).toBe(true)
    expect(outcome.installmentsCount).toBe(17)
    expect(outcome.installmentValue).toBeLessThanOrEqual(1000 + 0.01)
  })

  it('marca como inviável quando a parcela máxima é menor que os juros do primeiro período', () => {
    const params: SimulationParams = {
      treatmentValue: 14800,
      directCost: 6000,
      downPayment: 2500,
      monthlyRatePct: 3.5,
      mode: 'byInstallment',
      maxInstallment: 430,
    }

    const outcome = runSimulation(params, riskSettings)

    expect(outcome.feasible).toBe(false)
    expect(outcome.infeasibleMessage).toMatch(/Condição inviável/)
  })

  it('classifica risco elevado quando vários limites são ultrapassados', () => {
    const params: SimulationParams = {
      treatmentValue: 20000,
      directCost: 19000,
      downPayment: 0,
      monthlyRatePct: 8,
      mode: 'byTerm',
      installments: 36,
    }

    const outcome = runSimulation(params, riskSettings)

    expect(outcome.risk.level).toBe('high')
    expect(outcome.risk.alerts.length).toBeGreaterThanOrEqual(3)
  })

  it('resultado negativo quando o recebimento não cobre o custo', () => {
    const params: SimulationParams = {
      treatmentValue: 10000,
      directCost: 15000,
      downPayment: 0,
      monthlyRatePct: 1,
      mode: 'byTerm',
      installments: 12,
    }

    const outcome = runSimulation(params, riskSettings)

    expect(outcome.costRecovery.covered).toBe(false)
    expect(outcome.managerialResult).toBeLessThan(0)
  })
})
