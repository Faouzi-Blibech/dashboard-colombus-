// Six KPI cards: Current Rate, 1D/7D/30D change, Period High/Low. The colored top
// border (--risk-color) reflects the active pair's risk level. Each cell binds to its
// own query so a slow/failed metric degrades independently.
import type { CSSProperties, ReactNode } from 'react'
import type { usePairAnalysis } from '../hooks/usePairAnalysis'
import { Skeleton } from './ui'
import { pairCode } from '../lib/constants'
import { formatPct, formatRate } from '../lib/format'
import type { Pair } from '../types/api'

type Analysis = ReturnType<typeof usePairAnalysis>

/** Up/down change span with arrow, matching the design. */
function Change({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={`change ${up ? 'up' : 'down'} tnum`}>
      <span className="arrow">{up ? '▲' : '▼'}</span>
      {formatPct(value)}
    </span>
  )
}

function KpiCard({
  label,
  isLoading,
  isError,
  value,
  foot,
  riskColor,
}: {
  label: string
  isLoading: boolean
  isError: boolean
  value: ReactNode
  foot: ReactNode
  riskColor: string
}) {
  let body: ReactNode
  if (isLoading) body = <Skeleton height={24} width="70%" />
  else if (isError) body = '—'
  else body = value

  return (
    <div className="card kpi-card" style={{ '--risk-color': riskColor } as CSSProperties}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value tnum">{body}</span>
      <span className="kpi-foot">{isLoading || isError ? '—' : foot}</span>
    </div>
  )
}

export function KpiCards({
  pair,
  analysis,
  riskColor,
}: {
  pair: Pair
  analysis: Analysis
  riskColor: string
}) {
  const { dailyChange, weekly, monthly, highLow } = analysis
  const dim = (t: string) => <span style={{ color: 'var(--text-dim)' }}>{t}</span>

  return (
    <section className="kpi-grid">
      <KpiCard
        label="Current Rate"
        isLoading={dailyChange.isLoading}
        isError={dailyChange.isError}
        riskColor={riskColor}
        value={dailyChange.data && formatRate(dailyChange.data.rate)}
        foot={<span className="mono" style={{ color: 'var(--text-dim)' }}>{pairCode(pair)}</span>}
      />
      <KpiCard
        label="1-Day Change"
        isLoading={dailyChange.isLoading}
        isError={dailyChange.isError}
        riskColor={riskColor}
        value={dailyChange.data && <Change value={dailyChange.data.change_pct} />}
        foot={dim('vs. yesterday')}
      />
      <KpiCard
        label="7-Day Change"
        isLoading={weekly.isLoading}
        isError={weekly.isError}
        riskColor={riskColor}
        value={weekly.data && <Change value={weekly.data.change_pct} />}
        foot={dim('vs. 7 days ago')}
      />
      <KpiCard
        label="30-Day Change"
        isLoading={monthly.isLoading}
        isError={monthly.isError}
        riskColor={riskColor}
        value={monthly.data && <Change value={monthly.data.change_pct} />}
        foot={dim('vs. 30 days ago')}
      />
      <KpiCard
        label="Period High"
        isLoading={highLow.isLoading}
        isError={highLow.isError}
        riskColor={riskColor}
        value={highLow.data && formatRate(highLow.data.high)}
        foot={dim('30-day max')}
      />
      <KpiCard
        label="Period Low"
        isLoading={highLow.isLoading}
        isError={highLow.isError}
        riskColor={riskColor}
        value={highLow.data && formatRate(highLow.data.low)}
        foot={dim('30-day min')}
      />
    </section>
  )
}
