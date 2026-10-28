// Hash routing (#/senateurs): GitHub Pages cannot rewrite URLs to index.html, so a path-based router would
// return a 404 on reload. The hash also keeps every path relative (base './').
import type { ReactNode } from 'react'
import { createHashRouter, Navigate } from 'react-router'
import App from '@/App'
import { DEFAULT_PAGE, type Page, PAGES } from '@/lib/pages'
import { CandidatesPage } from '@/pages/CandidatesPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { DeputiesPage } from '@/pages/DeputiesPage'
import { GovernmentPage } from '@/pages/GovernmentPage'
import { SenatorsPage } from '@/pages/SenatorsPage'

// Pages that are built; the others show `ComingSoonPage`
const ELEMENTS: Partial<Record<Page, ReactNode>> = {
  deputies: <DeputiesPage />,
  senators: <SenatorsPage />,
  government: <GovernmentPage />,
  candidates: <CandidatesPage />,
}

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to={DEFAULT_PAGE.path} replace /> },
      // `handle` carries the page info, read by the layout for the tab title and the navbar
      ...PAGES.map((page) => ({
        path: page.path,
        handle: page,
        element: ELEMENTS[page.id] ?? <ComingSoonPage page={page.id} />,
      })),
      // Unknown path: back to the default page
      { path: '*', element: <Navigate to={DEFAULT_PAGE.path} replace /> },
    ],
  },
])
