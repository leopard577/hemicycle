import { CircleAlertIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert as AlertBox, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Alert, Severity } from '@/lib/money'
import { cn } from '@/lib/utils'

const STYLE: Record<Severity, { icon: typeof InfoIcon; className?: string; variant: 'default' | 'destructive' }> = {
  serious: { icon: CircleAlertIcon, variant: 'destructive', className: 'border-red-600/40 bg-red-600/5' },
  warning: {
    icon: TriangleAlertIcon,
    variant: 'default',
    className: 'border-orange-500/40 bg-orange-500/5 *:[svg]:text-orange-600',
  },
  info: { icon: InfoIcon, variant: 'default' },
}

/** What crossing the public registers reveals, under the seat cost */
export function Alerts({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null

  return (
    <section className="space-y-2 px-6 pb-3" aria-label="Ce que révèlent les registres publics">
      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Ce que révèlent les registres publics
      </h3>
      {alerts.map((a) => {
        const { icon: Icon, variant, className } = STYLE[a.severity]
        return (
          <AlertBox key={a.title} variant={variant} className={cn(className)}>
            <Icon />
            <AlertTitle className="line-clamp-none">{a.title}</AlertTitle>
            <AlertDescription>{a.detail}</AlertDescription>
          </AlertBox>
        )
      })}
    </section>
  )
}
