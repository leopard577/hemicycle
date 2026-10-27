import type { ReactNode } from 'react'
import { ChevronDownIcon, CircleAlertIcon, InfoIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Fields({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">{children}</dl>
}

export function Field({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? 'font-semibold' : undefined}>{children}</dd>
    </>
  )
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="break-all text-primary underline underline-offset-4">
      {children}
    </a>
  )
}

/** Encadré signalant une donnée absente : `missing` pour une déclaration non déposée */
export function MissingData({
  title,
  children,
  missing = false,
}: {
  title: string
  children?: ReactNode
  missing?: boolean
}) {
  return (
    <Alert variant={missing ? 'destructive' : 'default'}>
      {missing ? <CircleAlertIcon /> : <InfoIcon />}
      <AlertTitle>{title}</AlertTitle>
      {children && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

/** Chiffre clé affiché en tuile sous l'en-tête du panneau */
export function KeyFigure({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/60 px-3 py-2">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg leading-tight font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="truncate text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}

/** Précisions méthodologiques repliées en bas d'onglet, pour ne pas noyer les données */
export function Precisions({ children }: { children: ReactNode }) {
  return (
    <Collapsible className="py-4">
      <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <InfoIcon className="size-3.5" />
        Précisions et sources
        <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}
