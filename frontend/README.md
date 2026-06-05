# FX Risk Alert Dashboard — Frontend

React + TypeScript + Vite single-page dashboard for Colombus Capital. Recreates the
approved Claude design and is wired to the FastAPI backend (`/api/v1`) via TanStack Query.
Runs fully standalone on a mock data layer until the backend is live.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
```

Mock mode is on by default (`.env` → `VITE_USE_MOCKS=true`), so the dashboard works with
no backend. To run against the real API:

```bash
# .env
VITE_USE_MOCKS=false
VITE_API_BASE=/api/v1
```

In dev, Vite proxies `/api/v1` → `http://localhost:8000` (see `vite.config.ts`). For the
single-URL demo, `npm run build` emits `dist/`, which the backend static-mounts at `/`.

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm test` — unit tests (Vitest)
- `npm run lint` — ESLint

## Architecture

```
src/
  types/api.ts        # backend contract types (mirrors plan.md)
  api/
    client.ts         # typed fetch + ApiError (status-aware: 422/502/503)
    endpoints.ts      # one fn per endpoint; switches to mocks when VITE_USE_MOCKS
    mocks/fixtures.ts  # design's canonical numbers + seeded history
  hooks/              # TanStack Query hooks; usePairAnalysis fans out the KPI view
  lib/                # constants (PAIRS, tokens), date math, formatting
  components/         # design ports (BrandBar, Header, KpiCards, RiskBadge,
                      #   RateChart, VolatilityGauge, ComparisonTable, MarketIntelligence)
  styles/             # tokens.css (brand + light theme), dashboard.css (design CSS)
```

### Backend contract (consumed here)

Base `/api/v1`, path-based `/{base}/{quote}`. The dashboard has no single analysis
endpoint, so the KPI view composes several calls in parallel:

| Widget | Endpoint |
|--------|----------|
| Current rate + 1D | `/rates/{b}/{q}/daily-change` |
| 7D / 30D | `/rates/{b}/{q}/performance?period=weekly\|monthly` |
| High / Low | `/rates/{b}/{q}/high-low` |
| Chart | `/rates/{b}/{q}?from_date&to_date` |
| Volatility gauge | `/rates/{b}/{q}/volatility` |
| Risk badge | `/alerts/{b}/{q}` |
| Comparison table | `/analysis/summary` |
| AI card | `POST /ai/commentary` |

### Open items to confirm with the backend

1. `/analysis/summary` `pairs[]` shape — frontend assumes
   `{ base, quote, rate?, daily_change_pct, risk_level, annualized_vol }`. The table
   shows "—" for rate if the backend omits it.
2. CORS must allow `http://localhost:5173` in dev.
3. Omitting `date` should return the latest-in-DB row.
