// Currency-pair overview table from GET /analysis/summary. Click a row to switch the
// dashboard; the active pair's row is highlighted.
import type { CSSProperties } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { AnalysisSummary, Pair, SummaryPair } from '../types/api'
import { pairCode } from '../lib/constants'
import { Skeleton, ErrorState } from './ui'
import { annualizedToDailyPct, formatPct, formatRate, riskDisplay } from '../lib/format'

const VOL_MAX = 1.5 // daily-vol ceiling for the bar (matches the design)

function Row({
  row,
  active,
  onSelect,
}: {
  row: SummaryPair
  active: boolean
  onSelect: (pair: Pair) => void
}) {
  const code = `${row.base}/${row.quote}`
  const up = row.daily_change_pct >= 0
  const dailyVol = annualizedToDailyPct(row.annualized_vol)
  const volPct = Math.min(100, (dailyVol / VOL_MAX) * 100)
  const risk = riskDisplay(row.risk_level)

  return (
    <tr className={active ? 'active' : ''} onClick={() => onSelect({ base: row.base, quote: row.quote })}>
      <td>
        <span className="pair-cell">
          <span className="ic">{row.base}</span>
          <span className="mono">{code}</span>
        </span>
      </td>
      <td className="tnum mono">{row.rate !== undefined ? formatRate(row.rate) : '—'}</td>
      <td>
        <span className={`change ${up ? 'up' : 'down'} tnum`}>
          <span className="arrow">{up ? '▲' : '▼'}</span>
          {formatPct(row.daily_change_pct)}
        </span>
      </td>
      <td>
        <span className="vol-bar">
          <span style={{ width: `${volPct.toFixed(0)}%` }} />
        </span>
        <span
          className="mono tnum"
          style={{ marginLeft: 8, color: 'var(--text-mute)', fontSize: 12 }}
        >
          {dailyVol.toFixed(2)}%
        </span>
      </td>
      <td>
        <span className="risk-chip" style={{ '--chip': risk.color } as CSSProperties}>
          <span className="d" />
          {risk.label}
        </span>
      </td>
    </tr>
  )
}

export function ComparisonTable({
  summary,
  selected,
  onSelect,
}: {
  summary: UseQueryResult<AnalysisSummary>
  selected: Pair
  onSelect: (pair: Pair) => void
}) {
  return (
    <section className="card table-card">
      <div className="card-head">
        <div>
          <h3>Currency Pair Overview</h3>
          <span className="hint">Click any row to switch the dashboard</span>
        </div>
        <span className="hint mono">
          {summary.data ? `Snapshot · ${new Date().toLocaleString('en-GB')}` : '—'}
        </span>
      </div>

      {summary.isLoading ? (
        <Skeleton height={200} />
      ) : summary.isError || !summary.data ? (
        <ErrorState message="Summary unavailable." />
      ) : (
        <table className="pairs-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Current Rate</th>
              <th>1D Change</th>
              <th>Volatility</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {summary.data.pairs.map((row) => (
              <Row
                key={`${row.base}/${row.quote}`}
                row={row}
                active={`${row.base}/${row.quote}` === pairCode(selected)}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
