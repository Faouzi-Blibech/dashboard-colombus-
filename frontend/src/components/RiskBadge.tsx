// Prominent risk assessment card: circular badge + dynamic explanation, tinted by the
// active pair's risk level.
import type { CSSProperties } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Alert, RiskLevel } from '../types/api'
import { Skeleton, ErrorState } from './ui'
import { formatPct, riskDisplay } from '../lib/format'

/** Threshold explanation matching the approved design copy. */
function explain(level: RiskLevel, dailyPct: number): string {
  const abs = Math.abs(dailyPct).toFixed(2)
  if (level === 'high') return `Daily movement of ${abs}% exceeded the 1.00% high-risk threshold.`
  if (level === 'medium')
    return `Daily movement of ${abs}% is approaching the 1.00% high-risk threshold.`
  return `Daily movement of ${abs}% is well within the 1.00% low-risk threshold.`
}

export function RiskBadge({ alert }: { alert: UseQueryResult<Alert> }) {
  if (alert.isLoading)
    return (
      <section className="card risk-card">
        <Skeleton height={92} width={92} />
        <div className="risk-body" style={{ flex: 1 }}>
          <Skeleton height={48} />
        </div>
      </section>
    )
  if (alert.isError || !alert.data)
    return (
      <section className="card risk-card">
        <ErrorState message="Risk level unavailable." />
      </section>
    )

  const { color, label } = riskDisplay(alert.data.risk_level)
  const detail = `Daily movement: ${formatPct(alert.data.daily_change_pct)}. ${explain(
    alert.data.risk_level,
    alert.data.daily_change_pct,
  )}`

  return (
    <section className="card risk-card" style={{ '--risk-color': color } as CSSProperties}>
      <div className="risk-badge">{label}</div>
      <div className="risk-body">
        <div className="risk-eyebrow">Risk Assessment</div>
        <h2 className="risk-title">
          Current alert: <span className="accent">{label}</span>
        </h2>
        <p className="risk-detail">{detail}</p>
      </div>
    </section>
  )
}
