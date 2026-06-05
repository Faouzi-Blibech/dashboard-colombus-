import { describe, expect, it } from 'vitest'
import { daysAgo, periodRange, toIsoDate, today } from './dates'

describe('toIsoDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date('2025-06-04T12:00:00Z'))).toBe('2025-06-04')
  })
})

describe('daysAgo', () => {
  it('subtracts days from a fixed reference', () => {
    const ref = new Date('2025-06-30T00:00:00Z')
    expect(daysAgo(30, ref)).toBe('2025-05-31')
    expect(daysAgo(0, ref)).toBe('2025-06-30')
  })
})

describe('periodRange', () => {
  it('ends today and spans the period', () => {
    const { from_date, to_date } = periodRange(7)
    expect(to_date).toBe(today())
    expect(from_date < to_date).toBe(true)
  })
})
