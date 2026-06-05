// Dashboard footer: branding + data-source attribution.
export function Footer() {
  return (
    <footer className="app-footer">
      <span>Colombus Capital © {new Date().getFullYear()} — FX Risk Alert Dashboard</span>
      <span className="source">Data source: European Central Bank via Frankfurter API</span>
    </footer>
  )
}
