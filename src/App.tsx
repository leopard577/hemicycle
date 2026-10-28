import { useEffect, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { Navbar } from '@/components/Navbar'
import { type LayoutContext, useCurrentPage } from '@/lib/layout'
import { cn } from '@/lib/utils'

/** Shared layout: the navbar, then the page of the current route */
export default function App() {
  const page = useCurrentPage()
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    document.title = page ? `${page.label} · Hémicycle` : 'Hémicycle'
  }, [page])

  return (
    // While the panel is open its width is reserved as padding: the content stays centred in the free space
    <div className={cn('flex min-h-svh flex-col transition-[padding] duration-300', panelOpen && 'lg:pr-[30rem]')}>
      <Navbar page={page?.id} />
      <Outlet context={{ onPanelChange: setPanelOpen } satisfies LayoutContext} />
      {/* Back to the top on a new page, previous position on back / forward */}
      <ScrollRestoration />
    </div>
  )
}
