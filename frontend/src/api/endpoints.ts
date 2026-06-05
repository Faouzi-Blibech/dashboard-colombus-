// One function per backend endpoint. When VITE_USE_MOCKS is true, returns synthetic
// data from ./mocks instead of hitting the network — so the app runs fully standalone.
import type {
  Alert,
  AnalysisSummary,
  Commentary,
  Currency,
  DailyChange,
  HighLow,
  Pair,
  Performance,
  RatePoint,
  Volatility,
} from '../types/api'
import { get, post } from './client'
import * as mocks from './mocks/fixtures'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

/** Resolve a value after a short delay so mock loading states are observable. */
function mock<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

type DateRange = { from_date?: string; to_date?: string }

export function getCurrencies(): Promise<Currency[]> {
  if (USE_MOCKS) return mock(mocks.mockCurrencies())
  return get<Currency[]>('/currencies')
}

export function getRates(pair: Pair, range: DateRange): Promise<RatePoint[]> {
  if (USE_MOCKS) return mock(mocks.mockRates(pair.base, pair.quote, range.from_date, range.to_date))
  return get<RatePoint[]>(`/rates/${pair.base}/${pair.quote}`, range)
}

export function getDailyChange(pair: Pair, date?: string): Promise<DailyChange> {
  if (USE_MOCKS) return mock(mocks.mockDailyChange(pair.base, pair.quote, date))
  return get<DailyChange>(`/rates/${pair.base}/${pair.quote}/daily-change`, { date })
}

export function getPerformance(pair: Pair, period: 'weekly' | 'monthly'): Promise<Performance> {
  if (USE_MOCKS) return mock(mocks.mockPerformance(pair.base, pair.quote, period))
  return get<Performance>(`/rates/${pair.base}/${pair.quote}/performance`, { period })
}

export function getHighLow(pair: Pair, range: DateRange): Promise<HighLow> {
  if (USE_MOCKS) return mock(mocks.mockHighLow(pair.base, pair.quote, range.from_date, range.to_date))
  return get<HighLow>(`/rates/${pair.base}/${pair.quote}/high-low`, range)
}

export function getVolatility(pair: Pair, range: DateRange): Promise<Volatility> {
  if (USE_MOCKS)
    return mock(mocks.mockVolatility(pair.base, pair.quote, range.from_date, range.to_date))
  return get<Volatility>(`/rates/${pair.base}/${pair.quote}/volatility`, range)
}

export function getAlert(pair: Pair, date?: string): Promise<Alert> {
  if (USE_MOCKS) return mock(mocks.mockAlert(pair.base, pair.quote, date))
  return get<Alert>(`/alerts/${pair.base}/${pair.quote}`, { date })
}

export function getAlertHistory(pair: Pair, range: DateRange): Promise<Alert[]> {
  if (USE_MOCKS)
    return mock(mocks.mockAlertHistory(pair.base, pair.quote, range.from_date, range.to_date))
  return get<Alert[]>(`/alerts/${pair.base}/${pair.quote}/history`, range)
}

export function getSummary(): Promise<AnalysisSummary> {
  if (USE_MOCKS) return mock(mocks.mockSummary())
  return get<AnalysisSummary>('/analysis/summary')
}

export function getCommentary(pair: Pair, date: string): Promise<Commentary> {
  if (USE_MOCKS) return mock(mocks.mockCommentary(pair.base, pair.quote), 600)
  return post<Commentary>('/ai/commentary', { base: pair.base, quote: pair.quote, date })
}
