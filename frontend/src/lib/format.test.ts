import { describe, expect, it } from 'vitest'
import {
  annualizedToDailyPct,
  direction,
  formatPct,
  formatRate,
  riskDisplay,
} from './format'

describe('formatRate', () => {
  it('formats to 4 decimals', () => {
    expect(formatRate(1.0842)).toBe('1.0842')
    expect(formatRate(3.1)).toBe('3.1000')
  })
})

describe('formatPct', () => {
  it('adds a + sign for positives and 2 decimals', () => {
    expect(formatPct(0.31)).toBe('+0.31%')
  })
  it('keeps the - sign for negatives', () => {
    expect(formatPct(-1.23)).toBe('-1.23%')
  })
})

describe('direction', () => {
  it('classifies sign', () => {
    expect(direction(1)).toBe('up')
    expect(direction(-1)).toBe('down')
    expect(direction(0)).toBe('flat')
  })
})

describe('riskDisplay', () => {
  it('maps levels to color + uppercase label', () => {
    expect(riskDisplay('low').label).toBe('LOW')
    expect(riskDisplay('medium').label).toBe('MEDIUM')
    expect(riskDisplay('high').label).toBe('HIGH')
    expect(riskDisplay('high').color).toBe('#EF4444')
  })
})

describe('annualizedToDailyPct', () => {
  it('inverts the sqrt(252) annualization', () => {
    const daily = 0.0042 // 0.42% as a fraction
    const annualized = daily * Math.sqrt(252)
    expect(annualizedToDailyPct(annualized)).toBeCloseTo(0.42, 6)
  })
})
