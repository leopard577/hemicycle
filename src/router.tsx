// Hash routing (#/senateurs): GitHub Pages cannot rewrite URLs to index.html, so a path-based router would
// return a 404 on reload. The hash also keeps every path relative (base './').
import type { ReactNode } from 'react'
import { createHashRouter, Navigate } from 'react-router'
import App from '@/App'
import { DEFAULT_PAGE, type Page, PAGES, pathTo } from '@/lib/pages'
import { AboutPage } from '@/pages/AboutPage'
import { CandidatesPage } from '@/pages/CandidatesPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { DeputiesPage } from '@/pages/DeputiesPage'
import { GovernmentPage } from '@/pages/GovernmentPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SenatorsPage } from '@/pages/SenatorsPage'

// Pages that are built; the others show `ComingSoonPage`
const ELEMENTS: Partial<Record<Page, ReactNode>> = {
  deputies: <DeputiesPage />,
  senators: <SenatorsPage />,
  government: <GovernmentPage />,
  candidates: <CandidatesPage />,
  about: <AboutPage />,
}

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Absolute target: a relative one would resolve under the unknown path (#/bla/deputes) and loop forever
      { index: true, element: <Navigate to={pathTo(DEFAULT_PAGE.id)} replace /> },
      // `handle` carries the page info, read by the layout for the tab title and the navbar
      ...PAGES.map((page) => ({
        path: page.path,
        handle: page,
        element: ELEMENTS[page.id] ?? <ComingSoonPage page={page.id} />,
      })),
      // Unknown path: a 404 page rather than a silent redirect
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
