import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { ExternalLink } from '@/components/panel/parts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { REPOSITORY } from '@/lib/site'

/** Placeholder with the shape of a page (eyebrow, title, key figures, main block) while its JSON loads */
export function PageLoading() {
  return (
    <div className="flex-1" aria-busy="true">
      <span className="sr-only">Chargement des données…</span>
      <div className="mx-auto w-full max-w-5xl space-y-2 px-6 py-3 sm:py-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
      </div>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="aspect-[2/1] w-full rounded-xl" />
      </div>
    </div>
  )
}

/** Shown when a page's JSON cannot be fetched: offers a reload and a way to report it */
export function PageError({ error }: { error: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <TriangleAlertIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold">Les données n'ont pas pu être chargées</h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez votre connexion puis réessayez. Si le problème persiste,{' '}
          <ExternalLink href={`${REPOSITORY}/issues`}>signalez-le</ExternalLink>.
        </p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>
        <RotateCwIcon />
        Réessayer
      </Button>
      <p className="text-xs text-muted-foreground/70">Détail : {error}</p>
    </div>
  )
}
