// Hash routing (#/senateurs): GitHub Pages cannot rewrite URLs to index.html, so a path-based router would
// return a 404 on reload. The hash also keeps every path relative (base './').
import { createHashRouter, Navigate } from 'react-router'
import App from '@/App'
import { DEFAULT_PAGE, PAGES } from '@/lib/pages'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { DeputiesPage } from '@/pages/DeputiesPage'

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
        element: page.id === 'deputies' ? <DeputiesPage /> : <ComingSoonPage page={page.id} />,
      })),
      // Unknown path: back to the default page
      { path: '*', element: <Navigate to={DEFAULT_PAGE.path} replace /> },
    ],
  },
])
