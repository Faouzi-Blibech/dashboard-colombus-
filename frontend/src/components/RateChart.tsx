// Historical rate line chart (Chart.js via react-chartjs-2) with a gold gradient fill,
// design-styled tooltip, and 7D/30D/90D range tabs.
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartArea,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Pair, RatePoint } from '../types/api'
import { PERIODS, type Period, pairCode } from '../lib/constants'
import { Skeleton, ErrorState, EmptyState } from './ui'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const DECIMALS = 4

function makeGradient(ctx: CanvasRenderingContext2D, area: ChartArea) {
  const g = ctx.createLinearGradient(0, area.top, 0, area.bottom)
  g.addColorStop(0, 'rgba(200,168,75,0.35)')
  g.addColorStop(0.5, 'rgba(43,76,126,0.18)')
  g.addColorStop(1, 'rgba(43,76,126,0)')
  return g
}

/** Short month/day label, e.g. "Jun 04". */
function shortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

export function RateChart({
  pair,
  rates,
  period,
  onPeriodChange,
}: {
  pair: Pair
  rates: UseQueryResult<RatePoint[]>
  period: Period
  onPeriodChange: (p: Period) => void
}) {
  const code = pairCode(pair)

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11, 36, 71, 0.96)',
        borderColor: '#1F4380',
        borderWidth: 1,
        padding: 12,
        titleColor: '#9FB6D6',
        titleFont: { size: 11, weight: 600 },
        bodyColor: '#F0F4F8',
        bodyFont: { family: 'JetBrains Mono', size: 13, weight: 600 },
        displayColors: false,
        callbacks: {
          title: (items) => String(items[0].label),
          label: (item) => `  ${code}  ${(item.parsed.y ?? 0).toFixed(DECIMALS)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#5E7794', font: { family: 'Inter', size: 11 }, maxRotation: 0, autoSkipPadding: 18 },
      },
      y: {
        grid: { color: 'rgba(31,67,128,0.6)' },
        border: { display: false },
        ticks: {
          color: '#5E7794',
          font: { family: 'JetBrains Mono', size: 11 },
          padding: 8,
          callback: (v) => Number(v).toFixed(DECIMALS),
        },
      },
    },
  }

  let body
  if (rates.isLoading) body = <Skeleton height={320} />
  else if (rates.isError) body = <ErrorState message="Rate history unavailable." />
  else if (!rates.data || rates.data.length === 0) body = <EmptyState message="No rate history." />
  else {
    const data = {
      labels: rates.data.map((r) => shortDate(r.date)),
      datasets: [
        {
          label: 'Rate',
          data: rates.data.map((r) => r.rate),
          borderColor: '#C8A84B',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#C8A84B',
          pointHoverBorderColor: '#0B2447',
          pointHoverBorderWidth: 2,
          tension: 0.32,
          fill: true,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const { ctx, chartArea } = context.chart
            if (!chartArea) return 'rgba(200,168,75,0.15)'
            return makeGradient(ctx, chartArea)
          },
        },
      ],
    }
    body = (
      <div className="chart-wrap">
        <Line data={data} options={options} />
      </div>
    )
  }

  return (
    <div className="card chart-card">
      <div className="card-head">
        <div>
          <h3>Historical Rate</h3>
          <span className="hint">{period}-day rate history</span>
        </div>
        <div className="range-tabs" role="group" aria-label="Chart range">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              className={p === period ? 'active' : ''}
              aria-pressed={p === period}
              onClick={() => onPeriodChange(p)}
            >
              {p}D
            </button>
          ))}
        </div>
      </div>
      {body}
    </div>
  )
}
