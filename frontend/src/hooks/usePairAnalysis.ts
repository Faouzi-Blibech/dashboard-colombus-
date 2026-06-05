// Composes the per-endpoint queries that make up the single-pair KPI view. The backend
// has no combined /analysis endpoint, so this fans out to daily-change, performance×2,
// high-low, volatility, and alert in parallel and exposes a unified loading/error shape.
import type { Period } from '../lib/constants'
import type { Pair } from '../types/api'
import {
  useAlert,
  useDailyChange,
  useHighLow,
  usePerformance,
  useVolatility,
} from './queries'

export function usePairAnalysis(pair: Pair, period: Period) {
  const dailyChange = useDailyChange(pair)
  const weekly = usePerformance(pair, 'weekly')
  const monthly = usePerformance(pair, 'monthly')
  const highLow = useHighLow(pair, period)
  const volatility = useVolatility(pair, period)
  const alert = useAlert(pair)

  const queries = [dailyChange, weekly, monthly, highLow, volatility, alert]

  return {
    dailyChange,
    weekly,
    monthly,
    highLow,
    volatility,
    alert,
    /** True while any constituent query is still loading. */
    isLoading: queries.some((q) => q.isLoading),
    /** True if every constituent query failed (full outage). */
    isError: queries.every((q) => q.isError),
    /** The latest rate date, used to drive AI commentary. */
    latestDate: dailyChange.data?.date,
  }
}
