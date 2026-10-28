import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { pathTo } from '@/lib/pages'

/**
 * Footer: the page's own sources, then the notice required by the HATVP legal notice (integrity, reserved
 * reproduction rights, no commercial use) and the link to the legal notice, present on every page.
 */
export function SiteFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
      {children}
      {children && <br />}
      Informations des déclarations reproduites sans modification depuis l'open data de la HATVP (Licence Ouverte
      Etalab) : droits de reproduction réservés et strictement limités, toute utilisation commerciale ou publicitaire
      est interdite.
      <br />
      <Link to={pathTo('about')} className="underline underline-offset-4 hover:text-foreground">
        À propos, mentions légales et contact
      </Link>
    </footer>
  )
}
