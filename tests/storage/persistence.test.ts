import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_RISK_SETTINGS, loadRiskSettings, saveRiskSettings } from '../../src/storage/riskSettings'
import { safeSetItem } from '../../src/storage/safeStorage'
import { DEFAULT_TREATMENTS, loadTreatments, saveTreatments } from '../../src/storage/treatments'

describe('cenário 12 — persistência local', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('salva e recupera apenas tratamentos cadastrados', () => {
    const treatments = [...DEFAULT_TREATMENTS, { id: 'x', name: 'Clareamento', price: 900, cost: 200 }]
    saveTreatments(treatments)
    expect(loadTreatments()).toEqual(treatments)
  })

  it('salva e recupera apenas parâmetros de risco', () => {
    const settings = { ...DEFAULT_RISK_SETTINGS, minMarginPct: 40 }
    saveRiskSettings(settings)
    expect(loadRiskSettings()).toEqual(settings)
  })

  it('não permite gravar sob chaves fora da lista permitida (nome, CPF, simulações)', () => {
    // @ts-expect-error — testando proteção contra chaves não autorizadas
    safeSetItem('haddad:patientName', 'Mariana Silva')
    // @ts-expect-error — testando proteção contra chaves não autorizadas
    safeSetItem('haddad:cpf', '12345678900')

    expect(window.localStorage.getItem('haddad:patientName')).toBeNull()
    expect(window.localStorage.getItem('haddad:cpf')).toBeNull()
  })

  it('o localStorage contém apenas as chaves de tratamentos e risco após uso normal', () => {
    saveTreatments(DEFAULT_TREATMENTS)
    saveRiskSettings(DEFAULT_RISK_SETTINGS)

    const keys = Object.keys(window.localStorage)
    expect(keys.sort()).toEqual(['haddad:riskSettings', 'haddad:treatments'])
  })
})
