import type { ReactNode } from 'react'
import { CircleAlertIcon, InfoIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 py-4">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>
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
