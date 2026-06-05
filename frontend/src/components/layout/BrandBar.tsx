// Navy Colombus Capital brand bar: interlocking "CO" mark + wordmark.
// Per request, the marketing nav (Our Services / About Us / Team / Contact) and the
// "Get Started" CTA are removed — only the Dashboard link remains.
export function BrandBar() {
  return (
    <div className="brand-bar">
      <div className="brand-bar-inner">
        <a className="brand" href="#" aria-label="Colombus Capital">
          <div className="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="22" cy="22" r="17" stroke="currentColor" strokeWidth="2.4" />
              <circle cx="42" cy="22" r="17" stroke="currentColor" strokeWidth="2.4" />
              <path d="M 22 5 A 17 17 0 0 0 22 39" stroke="var(--coral)" strokeWidth="2.4" fill="none" />
            </svg>
          </div>
          <div className="wordmark">
            <div className="name">COLOMBUS CAPITAL</div>
            <div className="tag">FX Intermediary · Tunis</div>
          </div>
        </a>
        <nav className="nav-links" aria-label="Main">
          <a href="#" className="active">
            Dashboard
          </a>
        </nav>
      </div>
    </div>
  )
}
