import { describe, expect, it } from 'vitest'
import { formatCurrency, parseCurrencyInput } from '../../src/utils/currency'

describe('parseCurrencyInput', () => {
  it('aceita os quatro formatos de entrada aceitos pelo sistema', () => {
    expect(parseCurrencyInput('14800')).toBe(14800)
    expect(parseCurrencyInput('14.800')).toBe(14800)
    expect(parseCurrencyInput('14.800,00')).toBe(14800)
    expect(parseCurrencyInput('14800,00')).toBe(14800)
  })

  it('lida com valores decimais não inteiros', () => {
    expect(parseCurrencyInput('932,55')).toBeCloseTo(932.55, 2)
    expect(parseCurrencyInput('1.234,56')).toBeCloseTo(1234.56, 2)
  })

  it('retorna zero para entrada vazia ou inválida', () => {
    expect(parseCurrencyInput('')).toBe(0)
    expect(parseCurrencyInput('abc')).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('formata no padrão brasileiro', () => {
    expect(formatCurrency(14800)).toContain('14.800,00')
    expect(formatCurrency(0)).toContain('0,00')
  })
})
