import { CircleAlertIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Alerte, Niveau } from '@/lib/argent'
import { cn } from '@/lib/utils'

const STYLE: Record<Niveau, { icon: typeof InfoIcon; className?: string; variant: 'default' | 'destructive' }> = {
  grave: { icon: CircleAlertIcon, variant: 'destructive', className: 'border-red-600/40 bg-red-600/5' },
  attention: {
    icon: TriangleAlertIcon,
    variant: 'default',
    className: 'border-orange-500/40 bg-orange-500/5 *:[svg]:text-orange-600',
  },
  info: { icon: InfoIcon, variant: 'default' },
}

/** Ce que révèle le croisement des registres publics, sous le coût du siège */
export function Alertes({ alertes }: { alertes: Alerte[] }) {
  if (!alertes.length) return null

  return (
    <section className="space-y-2 px-6 pb-3" aria-label="Ce que révèlent les registres publics">
      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Ce que révèlent les registres publics
      </h3>
      {alertes.map((a) => {
        const { icon: Icon, variant, className } = STYLE[a.niveau]
        return (
          <Alert key={a.titre} variant={variant} className={cn(className)}>
            <Icon />
            <AlertTitle className="line-clamp-none">{a.titre}</AlertTitle>
            <AlertDescription>{a.detail}</AlertDescription>
          </Alert>
        )
      })}
    </section>
  )
}
