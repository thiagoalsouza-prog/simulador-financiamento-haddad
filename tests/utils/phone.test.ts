import { describe, expect, it } from 'vitest'
import { isValidPhone, maskPhone, sanitizePhoneInput } from '../../src/utils/phone'

describe('sanitizePhoneInput', () => {
  it('mantém apenas dígitos e limita a 11 caracteres', () => {
    expect(sanitizePhoneInput('(11) 98765-4321')).toBe('11987654321')
    expect(sanitizePhoneInput('119876543219999')).toBe('11987654321')
    expect(sanitizePhoneInput('')).toBe('')
  })
})

describe('maskPhone', () => {
  it('formata celular com 11 dígitos', () => {
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321')
  })

  it('formata fixo com 10 dígitos', () => {
    expect(maskPhone('1132654321')).toBe('(11) 3265-4321')
  })

  it('formata parcialmente enquanto o usuário digita', () => {
    expect(maskPhone('1')).toBe('(1')
    expect(maskPhone('11')).toBe('(11')
    expect(maskPhone('119')).toBe('(11) 9')
  })
})

describe('isValidPhone', () => {
  it('aceita 10 ou 11 dígitos', () => {
    expect(isValidPhone('11987654321')).toBe(true)
    expect(isValidPhone('1132654321')).toBe(true)
  })

  it('rejeita quantidades diferentes de dígitos', () => {
    expect(isValidPhone('119876543')).toBe(false)
    expect(isValidPhone('')).toBe(false)
  })
})
