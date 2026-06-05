// TanStack Query hooks — one per endpoint. Query keys include pair + period so the
// cache differentiates pairs/ranges and re-selecting a pair resolves instantly.
import { useQuery } from '@tanstack/react-query'
import type { Pair } from '../types/api'
import type { Period } from '../lib/constants'
import { pairCode } from '../lib/constants'
import { periodRange } from '../lib/dates'
import * as api from '../api/endpoints'

export function useCurrencies() {
  return useQuery({ queryKey: ['currencies'], queryFn: api.getCurrencies, staleTime: Infinity })
}

export function useRates(pair: Pair, period: Period) {
  return useQuery({
    queryKey: ['rates', pairCode(pair), period],
    queryFn: () => api.getRates(pair, periodRange(period)),
  })
}

export function useDailyChange(pair: Pair) {
  return useQuery({
    queryKey: ['daily-change', pairCode(pair)],
    queryFn: () => api.getDailyChange(pair),
  })
}

export function usePerformance(pair: Pair, period: 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['performance', pairCode(pair), period],
    queryFn: () => api.getPerformance(pair, period),
  })
}

export function useHighLow(pair: Pair, period: Period) {
  return useQuery({
    queryKey: ['high-low', pairCode(pair), period],
    queryFn: () => api.getHighLow(pair, periodRange(period)),
  })
}

export function useVolatility(pair: Pair, period: Period) {
  return useQuery({
    queryKey: ['volatility', pairCode(pair), period],
    queryFn: () => api.getVolatility(pair, periodRange(period)),
  })
}

export function useAlert(pair: Pair) {
  return useQuery({ queryKey: ['alert', pairCode(pair)], queryFn: () => api.getAlert(pair) })
}

export function useAlertHistory(pair: Pair, period: Period) {
  return useQuery({
    queryKey: ['alert-history', pairCode(pair), period],
    queryFn: () => api.getAlertHistory(pair, periodRange(period)),
  })
}

export function useSummary() {
  return useQuery({ queryKey: ['summary'], queryFn: api.getSummary })
}
