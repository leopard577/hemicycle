import type { ReactNode } from 'react'
import { ChevronDownIcon, CircleAlertIcon, InfoIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

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

/** Box flagging missing data: `missing` for a declaration that was not filed */
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

/** Key figure shown as a tile under the panel header */
export function KeyFigure({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  /** Emphasises the figure when it reveals an overlap */
  highlight?: boolean
}) {
  return (
    <div className={cn('min-w-0 rounded-lg px-3 py-2', highlight ? 'bg-orange-500/10' : 'bg-muted/60')}>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'font-heading text-lg leading-tight font-semibold tabular-nums',
          highlight && 'text-orange-700 dark:text-orange-400',
        )}
      >
        {value}
      </dd>
      {hint && <dd className="truncate text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}

/** "Précisions et sources", collapsed at the bottom of the panel so they do not drown the data */
export function NotesAndSources({
  children,
  open,
  onOpenChange,
}: {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Collapsible className="py-4" open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="group -my-2 flex items-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        <InfoIcon className="size-3.5" />
        Précisions et sources
        <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-5">{children}</CollapsibleContent>
    </Collapsible>
  )
}

/** Group of notes in "Précisions et sources" */
export function NoteGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      {children}
    </section>
  )
}
