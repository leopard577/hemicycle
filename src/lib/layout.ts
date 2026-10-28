import { useMatches, useOutletContext } from 'react-router'
import type { PageInfo } from '@/lib/pages'

export interface LayoutContext {
  /** A page with a side panel reports whether it is open, so the layout can reserve its width */
  onPanelChange: (open: boolean) => void
}

/** Context the layout (`App`) passes to every page through its `<Outlet>` */
export const useLayout = () => useOutletContext<LayoutContext>()

/** Page of the current route, from the `handle` set in `router.tsx` */
export function useCurrentPage() {
  const match = useMatches().find((m) => m.handle)
  return match?.handle as PageInfo | undefined
}
