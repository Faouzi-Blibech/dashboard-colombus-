// Volatility index as a half-circle SVG gauge with an animated needle, ported from the
// design. Gauge value is the daily volatility (rolling 21d std, as a percent); the dot
// and status text are colored by the active pair's risk level.
import type { CSSProperties } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { RiskLevel, Volatility } from '../types/api'
import { VOL_GAUGE_MAX } from '../lib/constants'
import { riskDisplay } from '../lib/format'
import { Skeleton, ErrorState } from './ui'

const ARC = 267 // semicircle arc length (π × r, r = 85)

const STATUS: Record<RiskLevel, string> = {
  high: 'Elevated volatility — review hedging positions',
  medium: 'Moderate volatility — monitor closely',
  low: 'Stable conditions — within normal range',
}

export function VolatilityGauge({
  volatility,
  riskLevel,
}: {
  volatility: UseQueryResult<Volatility>
  riskLevel: RiskLevel | undefined
}) {
  const head = (
    <div className="card-head">
      <div>
        <h3>Volatility Index</h3>
        <span className="hint">Standard deviation, annualized %</span>
      </div>
    </div>
  )

  if (volatility.isLoading)
    return (
      <div className="card vol-card">
        {head}
        <Skeleton height={180} />
      </div>
    )
  if (volatility.isError || !volatility.data)
    return (
      <div className="card vol-card">
        {head}
        <ErrorState message="Volatility unavailable." />
      </div>
    )

  const dailyVol = volatility.data.rolling_21d_std * 100 // percent
  const pct = Math.max(0, Math.min(1, dailyVol / VOL_GAUGE_MAX))
  const dashoffset = (ARC * (1 - pct)).toFixed(2)
  const needleDeg = -90 + pct * 180
  const color = riskLevel ? riskDisplay(riskLevel).color : 'var(--accent)'

  return (
    <div className="card vol-card" style={{ '--risk-color': color } as CSSProperties}>
      {head}

      <div className="gauge-wrap">
        <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="55%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <path
            d="M 15 105 A 85 85 0 0 1 185 105"
            fill="none"
            stroke="var(--bg-soft)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 15 105 A 85 85 0 0 1 185 105"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={ARC}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1)' }}
          />
          <g
            style={{
              transition: 'transform 600ms cubic-bezier(.4,0,.2,1)',
              transformOrigin: '100px 105px',
              transform: `rotate(${needleDeg}deg)`,
            }}
          >
            <line x1="100" y1="105" x2="100" y2="32" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="100" cy="105" r="6" fill="var(--surface)" stroke="var(--text)" strokeWidth="2" />
          </g>
        </svg>
        <div className="gauge-readout">
          <div className="num">
            <span className="tnum">{dailyVol.toFixed(2)}</span>
            <span className="pct">%</span>
          </div>
          <div className="lbl">Daily volatility</div>
        </div>
      </div>

      <div className="gauge-legend">
        <span>STABLE</span>
        <span>MODERATE</span>
        <span>VOLATILE</span>
      </div>
      <div className="vol-status">
        <span className="dot" />
        <span>{riskLevel ? STATUS[riskLevel] : '—'}</span>
      </div>
    </div>
  )
}
