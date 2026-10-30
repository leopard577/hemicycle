import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { pathTo } from '@/lib/pages'
import { X_ACCOUNT } from '@/lib/site'

/**
 * Footer: the page's own sources, then the notice required by the HATVP legal notice (integrity, reserved
 * reproduction rights, no commercial use), the link to the legal notice and the project's X account, present on
 * every page.
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
      {' · '}
      <a
        href={`https://x.com/${X_ACCOUNT}`}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4 hover:text-foreground"
      >
        Suivre sur X : @{X_ACCOUNT}
      </a>
    </footer>
  )
}
