// Dashboard shell: owns selected-pair, chart period, and theme state (pair/period synced
// to the URL). Lays out the design's sections; data fetching lives in hooks.
import { useEffect, useState } from 'react'
import { BrandBar } from './components/layout/BrandBar'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { PairSelector } from './components/PairSelector'
import { KpiCards } from './components/KpiCards'
import { RiskBadge } from './components/RiskBadge'
import { RateChart } from './components/RateChart'
import { VolatilityGauge } from './components/VolatilityGauge'
import { ComparisonTable } from './components/ComparisonTable'
import { MarketIntelligence } from './components/MarketIntelligence'
import { usePairAnalysis } from './hooks/usePairAnalysis'
import { useRates, useSummary } from './hooks/queries'
import { riskDisplay } from './lib/format'
import { DEFAULT_PAIR, DEFAULT_PERIOD, PAIRS, pairCode, type Period } from './lib/constants'
import type { Pair } from './types/api'
import './styles/dashboard.css'

/** Read initial pair/period from the URL so views are shareable. */
function readUrlState(): { pair: Pair; period: Period } {
  const params = new URLSearchParams(window.location.search)
  const pair = PAIRS.find((p) => pairCode(p) === params.get('pair')) ?? DEFAULT_PAIR
  const n = Number(params.get('period'))
  const period = ([7, 30, 90] as Period[]).includes(n as Period) ? (n as Period) : DEFAULT_PERIOD
  return { pair, period }
}

export default function App() {
  const initial = readUrlState()
  const [pair, setPair] = useState<Pair>(initial.pair)
  const [period, setPeriod] = useState<Period>(initial.period)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Keep the URL in sync with selection.
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('pair', pairCode(pair))
    params.set('period', String(period))
    window.history.replaceState(null, '', `?${params.toString()}`)
  }, [pair, period])

  // Apply theme as a body class so the design's `body.light` tokens take effect.
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
  }, [theme])

  const analysis = usePairAnalysis(pair, period)
  const rates = useRates(pair, period)
  const summary = useSummary()

  const riskLevel = analysis.alert.data?.risk_level
  const riskColor = riskLevel ? riskDisplay(riskLevel).color : 'var(--accent)'

  return (
    <>
      <BrandBar />
      <Header theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />

      <main>
        <PairSelector selected={pair} onSelect={setPair} />

        <KpiCards pair={pair} analysis={analysis} riskColor={riskColor} />

        <RiskBadge alert={analysis.alert} />

        <section className="focus-grid">
          <RateChart pair={pair} rates={rates} period={period} onPeriodChange={setPeriod} />
          <VolatilityGauge volatility={analysis.volatility} riskLevel={riskLevel} />
        </section>

        <ComparisonTable summary={summary} selected={pair} onSelect={setPair} />

        <MarketIntelligence pair={pair} date={analysis.latestDate} />
      </main>

      <Footer />
    </>
  )
}
