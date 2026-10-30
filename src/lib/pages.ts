// Site pages. Ids are English; paths stay in French since visitors see them in the address bar (#/senateurs).
export type Page = 'deputies' | 'senators' | 'government' | 'candidates2027' | 'candidates' | 'about'

export interface PageInfo {
  id: Page
  path: string
  label: string
  /** Shown beside the theme button instead of in the list of pages */
  aside?: boolean
}

export const PAGES: PageInfo[] = [
  { id: 'deputies', path: 'deputes', label: 'Députés' },
  { id: 'senators', path: 'senateurs', label: 'Sénateurs' },
  { id: 'government', path: 'gouvernement', label: 'Gouvernement' },
  { id: 'candidates2027', path: 'candidats-2027', label: 'Candidats (2027)' },
  // Path kept from when it was the only candidates page, so existing links still work
  { id: 'candidates', path: 'candidats', label: 'Candidats (2022)' },
  { id: 'about', path: 'a-propos', label: 'À propos', aside: true },
]

export const DEFAULT_PAGE = PAGES[0]

export const pathTo = (page: Page) => `/${PAGES.find((p) => p.id === page)!.path}`
