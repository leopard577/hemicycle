import { Link, useLocation } from 'react-router'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { PAGES, pathTo } from '@/lib/pages'

/** Unknown path (#/bla): says so and links to every page, instead of silently redirecting */
export function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <>
      <div>
        <div className="mx-auto w-full max-w-5xl px-6 py-3 sm:py-5">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Erreur 404</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Page introuvable</h1>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-4">
        <p className="text-balance">
          Aucune page ne correspond à l'adresse <code className="break-all text-muted-foreground">#{pathname}</code>.
          Elle a peut-être été mal saisie, ou la page a changé de nom.
        </p>
        <nav aria-label="Pages du site" className="flex flex-wrap gap-2">
          {PAGES.map((p) => (
            <Button key={p.id} asChild variant="outline">
              <Link to={pathTo(p.id)}>{p.label}</Link>
            </Button>
          ))}
        </nav>
      </main>

      <SiteFooter />
    </>
  )
}
