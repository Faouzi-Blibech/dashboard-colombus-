// AI commentary hook. Backend route is POST /ai/commentary, but it is read-like and
// cached server-side, so we model it as a query keyed by pair + date. Disabled until a
// date is known (we use the latest rate date from daily-change).
import { useQuery } from '@tanstack/react-query'
import type { Pair } from '../types/api'
import { pairCode } from '../lib/constants'
import { getCommentary } from '../api/endpoints'

export function useCommentary(pair: Pair, date: string | undefined) {
  return useQuery({
    queryKey: ['commentary', pairCode(pair), date],
    queryFn: () => getCommentary(pair, date as string),
    enabled: Boolean(date),
    // AI can be slow/expensive; don't auto-refetch aggressively.
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
