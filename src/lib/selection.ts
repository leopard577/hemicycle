import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

// Query parameter of the hash (#/deputes?fiche=PA1234): visitors see it, so it is French like the paths
const PARAM = 'fiche'

/**
 * Id of the member whose panel is open, kept in the URL so a link reopens it. Replaces the history entry rather than
 * pushing one, so browsing seats does not fill the back button, and keeps the scroll position.
 */
export function useSelectedId() {
  const [params, setParams] = useSearchParams()
  const select = useCallback(
    (id: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id === null) next.delete(PARAM)
          else next.set(PARAM, id)
          return next
        },
        { replace: true, preventScrollReset: true },
      ),
    [setParams],
  )
  return [params.get(PARAM), select] as const
}
