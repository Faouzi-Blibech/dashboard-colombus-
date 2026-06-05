// Currency-pair pill selector. Keyboard accessible (arrow keys move between pairs).
import type { Pair } from '../types/api'
import { PAIRS, pairCode } from '../lib/constants'

export function PairSelector({
  selected,
  onSelect,
}: {
  selected: Pair
  onSelect: (pair: Pair) => void
}) {
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next =
      e.key === 'ArrowRight' ? (index + 1) % PAIRS.length : (index - 1 + PAIRS.length) % PAIRS.length
    onSelect(PAIRS[next])
  }

  return (
    <div className="selector-row">
      <span className="selector-label">Currency Pair</span>
      <div className="pill-group" role="tablist" aria-label="Currency pair">
        {PAIRS.map((pair, i) => {
          const active = pairCode(pair) === pairCode(selected)
          return (
            <button
              key={pairCode(pair)}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={`pill ${active ? 'active' : ''}`}
              onClick={() => onSelect(pair)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="flagpair">{pair.base}</span>
              <span style={{ opacity: 0.6 }}>/</span>
              <span style={{ marginLeft: 4 }}>{pair.quote}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
