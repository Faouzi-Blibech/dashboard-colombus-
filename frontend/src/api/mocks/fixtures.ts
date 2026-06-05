// Deterministic mock data for standalone mode. Embeds the canonical per-pair numbers
// from the approved Claude design so the mock demo matches the design exactly, then
// derives every endpoint response (and a seeded random-walk history) from them.
import type {
  Alert,
  AnalysisSummary,
  Commentary,
  Currency,
  DailyChange,
  HighLow,
  Performance,
  RatePoint,
  RiskLevel,
  SummaryPair,
  Volatility,
} from '../../types/api'
import { CURRENCY_NAMES, pairCode } from '../../lib/constants'
import { daysAgo, toIsoDate } from '../../lib/dates'

const SQRT_252 = Math.sqrt(252)

/** Canonical per-pair design data: rate, changes (%), high/low, daily volatility (%), risk, AI copy. */
interface PairData {
  rate: number
  d1: number
  d7: number
  d30: number
  high: number
  low: number
  volatility: number // daily volatility, percent (e.g. 0.42 = 0.42%)
  risk: RiskLevel
  decimals: number
  ai: string
}

const DATA: Record<string, PairData> = {
  'EUR/USD': {
    rate: 1.0842, d1: 0.31, d7: -0.82, d30: 1.24, high: 1.0951, low: 1.0701,
    volatility: 0.42, risk: 'low', decimals: 4,
    ai: 'The Euro shows modest daily appreciation against the US Dollar, supported by stable ECB policy signals. Volatility remains within normal bounds at 0.42%, indicating low short-term FX risk for European-exposed corporate clients. Companies with USD payment obligations may consider this a favorable window for hedging.',
  },
  'GBP/USD': {
    rate: 1.2734, d1: -1.23, d7: -0.55, d30: 2.1, high: 1.291, low: 1.258,
    volatility: 1.31, risk: 'high', decimals: 4,
    ai: 'Sterling has recorded a sharp 1.23% decline against the Dollar today, driven by weaker UK manufacturing data and renewed dollar strength. With daily movement breaching the 1% high-risk threshold and volatility at 1.31%, corporate clients with GBP exposure should exercise caution and review open positions. A continued bearish trend is possible in the short term.',
  },
  'USD/TND': {
    rate: 3.1764, d1: 0.08, d7: 0.22, d30: 0.61, high: 3.19, low: 3.154,
    volatility: 0.15, risk: 'low', decimals: 4,
    ai: "The Tunisian Dinar remains broadly stable against the US Dollar, with daily movement of just 0.08% — well within the low-risk threshold. The Central Bank of Tunisia's managed exchange rate policy continues to limit volatility. This pair presents minimal FX risk for import/export operations denominated in USD.",
  },
  'EUR/TND': {
    rate: 3.4428, d1: 0.74, d7: -0.31, d30: 1.87, high: 3.475, low: 3.39,
    volatility: 0.68, risk: 'medium', decimals: 4,
    ai: 'EUR/TND is showing moderate movement of 0.74% today, placing it in the medium-risk category. While not alarming, the trend suggests mild Euro strength that could slightly increase the cost of Euro-denominated imports for Tunisian businesses. Clients should monitor this pair over the next 48 hours.',
  },
}

const RISK_MESSAGES: Record<RiskLevel, string> = {
  low: 'Normal movement. No action required.',
  medium: 'Moderate movement. Monitor closely.',
  high: 'Significant movement. Consider hedging or delaying FX transactions.',
}

function data(base: string, quote: string): PairData {
  return DATA[`${base}/${quote}`]
}

// --- seeded random-walk history (mirrors the design's generateHistory) ---
function seedRand(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Generate `days` of daily rates trending from ~(rate adjusted by 30d) to the current rate. */
function generateHistory(base: string, quote: string, days: number): number[] {
  const p = data(base, quote)
  const code = `${base}/${quote}`
  const seed = [...code].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) + days
  const rand = seedRand(seed)
  const start = p.rate / (1 + p.d30 / 100)
  const end = p.rate
  const step = (end - start) / (days - 1)
  const sigma = (p.volatility / 100) * p.rate * 0.55
  const out: number[] = []
  let val = start
  for (let i = 0; i < days; i++) {
    const target = start + step * i
    val += (target - val) * 0.35 + (rand() - 0.5) * 2 * sigma
    out.push(val)
  }
  out[0] = (out[0] + start) / 2
  out[days - 1] = end
  return out
}

// --- per-endpoint mock responses ---

export function mockCurrencies(): Currency[] {
  return Object.entries(CURRENCY_NAMES).map(([code, name]) => ({ code, name }))
}

export function mockRates(base: string, quote: string, from?: string, _to?: string): RatePoint[] {
  // Infer day count from the from_date; default 30.
  let days = 30
  if (from) {
    const ms = Date.now() - new Date(from + 'T00:00:00').getTime()
    days = Math.max(2, Math.min(365, Math.round(ms / 86_400_000)))
  }
  const series = generateHistory(base, quote, days)
  return series.map((rate, i) => ({
    date: daysAgo(days - 1 - i),
    rate: Number(rate.toFixed(6)),
  }))
}

export function mockDailyChange(base: string, quote: string, _date?: string): DailyChange {
  const p = data(base, quote)
  const prev = p.rate / (1 + p.d1 / 100)
  return {
    date: toIsoDate(new Date()),
    rate: p.rate,
    prev_rate: Number(prev.toFixed(6)),
    change_pct: p.d1,
  }
}

export function mockPerformance(
  base: string,
  quote: string,
  period: 'weekly' | 'monthly',
): Performance {
  const p = data(base, quote)
  const offset = period === 'weekly' ? 7 : 30
  const changePct = period === 'weekly' ? p.d7 : p.d30
  const start = p.rate / (1 + changePct / 100)
  return {
    period,
    start_date: daysAgo(offset),
    end_date: toIsoDate(new Date()),
    start_rate: Number(start.toFixed(6)),
    end_rate: p.rate,
    change_pct: changePct,
  }
}

export function mockHighLow(base: string, quote: string, _from?: string, _to?: string): HighLow {
  const p = data(base, quote)
  return { high: p.high, high_date: daysAgo(8), low: p.low, low_date: daysAgo(22) }
}

export function mockVolatility(base: string, quote: string, _from?: string, _to?: string): Volatility {
  const p = data(base, quote)
  const dailyStd = p.volatility / 100
  return {
    rolling_21d_std: Number(dailyStd.toFixed(6)),
    annualized_vol: Number((dailyStd * SQRT_252).toFixed(6)),
    latest_date: toIsoDate(new Date()),
  }
}

export function mockAlert(base: string, quote: string, _date?: string): Alert {
  const p = data(base, quote)
  return {
    date: toIsoDate(new Date()),
    risk_level: p.risk,
    daily_change_pct: p.d1,
    message: RISK_MESSAGES[p.risk],
  }
}

export function mockAlertHistory(base: string, quote: string, from?: string, to?: string): Alert[] {
  const points = mockRates(base, quote, from, to)
  const out: Alert[] = []
  for (let i = 1; i < points.length; i++) {
    const pct = Number((((points[i].rate - points[i - 1].rate) / points[i - 1].rate) * 100).toFixed(4))
    const abs = Math.abs(pct)
    const level: RiskLevel = abs < 0.5 ? 'low' : abs < 1 ? 'medium' : 'high'
    if (level !== 'low') {
      out.push({ date: points[i].date, risk_level: level, daily_change_pct: pct, message: RISK_MESSAGES[level] })
    }
  }
  return out.reverse()
}

export function mockSummary(): AnalysisSummary {
  const pairs: SummaryPair[] = Object.entries(DATA).map(([code, p]) => {
    const [base, quote] = code.split('/')
    return {
      base,
      quote,
      rate: p.rate,
      daily_change_pct: p.d1,
      risk_level: p.risk,
      annualized_vol: Number(((p.volatility / 100) * SQRT_252).toFixed(6)),
    }
  })
  const byVol = [...pairs].sort((a, b) => b.annualized_vol - a.annualized_vol)
  const byMove = [...pairs].sort((a, b) => Math.abs(b.daily_change_pct) - Math.abs(a.daily_change_pct))
  return {
    most_volatile: pairCode(byVol[0]),
    most_stable: pairCode(byVol[byVol.length - 1]),
    biggest_mover: pairCode(byMove[0]),
    pairs,
  }
}

export function mockCommentary(base: string, quote: string): Commentary {
  return { commentary: data(base, quote).ai, date: toIsoDate(new Date()), cached: false }
}

/** Decimal places to display for a pair's rate (exposed for components). */
export function pairDecimals(base: string, quote: string): number {
  return data(base, quote)?.decimals ?? 4
}
