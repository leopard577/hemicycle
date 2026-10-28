import type { ReactNode } from 'react'

/**
 * Footer: the page's own sources, then the notice required by the HATVP legal notice (integrity, reserved
 * reproduction rights, no commercial use), present on every page.
 */
export function SiteFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
      {children}
      {children && <br />}
      Informations des déclarations reproduites sans modification depuis l'open data de la HATVP (Licence Ouverte
      Etalab) : droits de reproduction réservés et strictement limités, toute utilisation commerciale ou publicitaire
      est interdite.
    </footer>
  )
}
