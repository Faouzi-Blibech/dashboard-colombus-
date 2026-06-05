// API contract types — mirror the backend plan.md shapes exactly.
// Base path: /api/v1. Currency codes UPPERCASE. Dates "YYYY-MM-DD".

/** Risk classification, lowercase as returned by the backend. */
export type RiskLevel = 'low' | 'medium' | 'high'

/** A currency pair, used to build path-based endpoints /{base}/{quote}. */
export interface Pair {
  base: string
  quote: string
}

/** GET /currencies → [{ code, name }] */
export interface Currency {
  code: string
  name: string
}

/** One point of GET /rates/{base}/{quote} → [{ date, rate }] */
export interface RatePoint {
  date: string
  rate: number
}

/** GET /rates/{base}/{quote}/daily-change */
export interface DailyChange {
  date: string
  rate: number
  prev_rate: number
  change_pct: number
}

/** GET /rates/{base}/{quote}/performance?period=weekly|monthly */
export interface Performance {
  period: 'weekly' | 'monthly'
  start_date: string
  end_date: string
  start_rate: number
  end_rate: number
  change_pct: number
}

/** GET /rates/{base}/{quote}/high-low */
export interface HighLow {
  high: number
  high_date: string
  low: number
  low_date: string
}

/** GET /rates/{base}/{quote}/volatility */
export interface Volatility {
  rolling_21d_std: number
  annualized_vol: number
  latest_date: string
}

/** GET /alerts/{base}/{quote} */
export interface Alert {
  date: string
  risk_level: RiskLevel
  daily_change_pct: number
  message: string
}

/**
 * One row of GET /analysis/summary `pairs[]`.
 * NOTE: exact shape unconfirmed with backend — see plan.md open item #1.
 */
export interface SummaryPair {
  base: string
  quote: string
  /** Current rate. Optional: confirm the backend includes it (plan.md open item #1). */
  rate?: number
  daily_change_pct: number
  risk_level: RiskLevel
  annualized_vol: number
}

/** GET /analysis/summary */
export interface AnalysisSummary {
  most_volatile: string
  most_stable: string
  biggest_mover: string
  pairs: SummaryPair[]
}

/** POST /ai/commentary → { commentary, date, cached } */
export interface Commentary {
  commentary: string
  date: string
  cached: boolean
}
