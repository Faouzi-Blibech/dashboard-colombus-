// Small presentational primitives shared across widgets for loading/error/empty states.
import type { ReactNode } from 'react'
import './ui.css'

export function Skeleton({
  height = 20,
  width = '100%',
}: {
  height?: number
  width?: string | number
}) {
  return <div className="skeleton" style={{ height, width }} aria-hidden="true" />
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon">⚠</span>
      <p>{message ?? 'Something went wrong.'}</p>
    </div>
  )
}

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="state state--empty">
      <p>{message ?? 'No data available.'}</p>
    </div>
  )
}

export type { ReactNode }
