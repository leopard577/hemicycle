// Site pages. Ids are English; paths stay in French since visitors see them in the address bar (#/senateurs).
export type Page = 'deputies' | 'senators' | 'government' | 'candidates'

export interface PageInfo {
  id: Page
  path: string
  label: string
}

export const PAGES: PageInfo[] = [
  { id: 'deputies', path: 'deputes', label: 'Députés' },
  { id: 'senators', path: 'senateurs', label: 'Sénateurs' },
  { id: 'government', path: 'gouvernement', label: 'Gouvernement' },
  { id: 'candidates', path: 'candidats', label: 'Candidats' },
]

export const DEFAULT_PAGE = PAGES[0]

export const pathTo = (page: Page) => `/${PAGES.find((p) => p.id === page)!.path}`
