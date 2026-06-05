// Date helpers: translate UI period buttons into the backend's from_date/to_date params.
import type { Period } from './constants'

/** Format a Date as "YYYY-MM-DD" (UTC-safe, no time component). */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Today as "YYYY-MM-DD". */
export function today(): string {
  return toIsoDate(new Date())
}

/** "YYYY-MM-DD" for N days before `from` (defaults to today). */
export function daysAgo(n: number, from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return toIsoDate(d)
}

/** A period (7/30/90 days) → { from_date, to_date } range ending today. */
export function periodRange(period: Period): { from_date: string; to_date: string } {
  return { from_date: daysAgo(period), to_date: today() }
}
