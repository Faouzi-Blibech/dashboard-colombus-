// Display formatting helpers: rates, percentages, dates, and risk presentation.
import type { RiskLevel } from '../types/api'
import { COLORS } from './constants'

const SQRT_252 = Math.sqrt(252)

/** Format an exchange rate with 4 significant decimals (e.g. 1.0842). */
export function formatRate(rate: number): string {
  return rate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

/** Format a percentage with a sign and 2 decimals (e.g. +0.31%, -0.82%). */
export function formatPct(pct: number): string {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

/** 'up' | 'down' | 'flat' for a signed change, used to drive color/arrow. */
export function direction(value: number): 'up' | 'down' | 'flat' {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

/** "YYYY-MM-DD" → "Jun 4, 2025". */
export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Presentation for a risk level: brand color + uppercase label. */
export function riskDisplay(level: RiskLevel): { color: string; label: string } {
  switch (level) {
    case 'low':
      return { color: COLORS.low, label: 'LOW' }
    case 'medium':
      return { color: COLORS.medium, label: 'MEDIUM' }
    case 'high':
      return { color: COLORS.high, label: 'HIGH' }
  }
}

/** Convert annualized volatility (fraction) to a daily volatility percentage. */
export function annualizedToDailyPct(annualizedVol: number): number {
  return (annualizedVol / SQRT_252) * 100
}
