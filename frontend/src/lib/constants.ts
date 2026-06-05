// App-wide constants: the fixed pair list, period options, and Colombus brand palette.
import type { Pair } from '../types/api'

/**
 * The 4 pairs the dashboard tracks. Defined here because GET /currencies returns
 * individual currencies (not pairs), so the frontend owns the pair list.
 */
export const PAIRS: Pair[] = [
  { base: 'EUR', quote: 'USD' },
  { base: 'GBP', quote: 'USD' },
  { base: 'USD', quote: 'TND' },
  { base: 'EUR', quote: 'TND' },
]

/** Human-readable currency names (fallback if /currencies is unavailable). */
export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  TND: 'Tunisian Dinar',
}

/** "EUR/USD" display string for a pair. */
export function pairCode(pair: Pair): string {
  return `${pair.base}/${pair.quote}`
}

/** Chart period options, in days. */
export const PERIODS = [7, 30, 90] as const
export type Period = (typeof PERIODS)[number]
export const DEFAULT_PERIOD: Period = 30

/** Default selected pair on first load. */
export const DEFAULT_PAIR: Pair = PAIRS[0]

/** Daily volatility (%) treated as full-scale on the gauge (matches the design's MAX_VOL). */
export const VOL_GAUGE_MAX = 1.5

/** Colombus Capital brand palette (mirrors styles/tokens.css design tokens). */
export const COLORS = {
  primary: '#0B2447',
  secondary: '#19A7CE',
  accent: '#C8A84B',
  coral: '#FF7A6B',
  bg: '#0B2447',
  surface: '#11305E',
  border: '#1F4380',
  text: '#F0F4F8',
  muted: '#9FB6D6',
  dim: '#6A85AB',
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
} as const
