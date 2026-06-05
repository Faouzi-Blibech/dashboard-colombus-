import { describe, expect, it } from 'vitest'
import {
  mockAlert,
  mockDailyChange,
  mockHighLow,
  mockRates,
  mockSummary,
  mockVolatility,
} from './fixtures'

describe('mock fixtures match the design canonical data', () => {
  it('daily change returns the design rate and 1D change', () => {
    const dc = mockDailyChange('EUR', 'USD')
    expect(dc.rate).toBe(1.0842)
    expect(dc.change_pct).toBe(0.31)
  })

  it('GBP/USD is classified high risk', () => {
    expect(mockAlert('GBP', 'USD').risk_level).toBe('high')
  })

  it('high is the period max and low the period min', () => {
    const hl = mockHighLow('EUR', 'USD')
    expect(hl.high).toBeGreaterThan(hl.low)
    expect(hl.high).toBe(1.0951)
    expect(hl.low).toBe(1.0701)
  })

  it('volatility annualizes the daily std', () => {
    const v = mockVolatility('EUR', 'USD')
    expect(v.rolling_21d_std).toBeCloseTo(0.0042, 6)
    expect(v.annualized_vol).toBeCloseTo(0.0042 * Math.sqrt(252), 5)
  })

  it('rates series ends at the current rate', () => {
    const series = mockRates('EUR', 'USD', undefined, undefined)
    expect(series.length).toBeGreaterThan(0)
    expect(series[series.length - 1].rate).toBeCloseTo(1.0842, 4)
  })

  it('summary returns all 4 pairs with a most-volatile pick', () => {
    const s = mockSummary()
    expect(s.pairs).toHaveLength(4)
    expect(s.most_volatile).toBe('GBP/USD')
  })
})
