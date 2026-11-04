import { Badge } from '@/components/ui/badge'
import {
  CASIER_POLITIQUE,
  formatAmount,
  formatConvictionDate,
  formatTerm,
  NATURE_LABELS,
  STATUS_LABELS,
} from '@/lib/convictions'
import { cn } from '@/lib/utils'
import type { Conviction } from '@/types'
import { ExternalLink, Field, Fields, MissingData } from './parts'

/** What the data is and is not: shown wherever convictions are, as a condition of importing them unverified */
export function ConvictionsCaveat({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Extraction automatique de Wikipédia par une IA, réalisée par{' '}
      <ExternalLink href={CASIER_POLITIQUE.url}>
        {CASIER_POLITIQUE.label} ({CASIER_POLITIQUE.author})
      </ExternalLink>
      , sous licence <ExternalLink href={CASIER_POLITIQUE.licenseUrl}>{CASIER_POLITIQUE.license}</ExternalLink> : non
      vérifiée affaire par affaire, arrêtée à mai 2026 environ. Elle peut contenir des erreurs ou des oublis : vérifiez
      avant de citer. Ne pas y figurer ne signifie pas n'avoir jamais été condamné. Une condamnation ancienne peut avoir
      été amnistiée ou effacée par une réhabilitation. Une personne dont la condamnation fait l'objet d'un recours reste
      présumée innocente.
    </p>
  )
}

function Decision({ conviction: c }: { conviction: Conviction }) {
  const prison = formatTerm(c.prisonMonths)
  const ineligibility = formatTerm(c.ineligibilityMonths, '')
  const amount = formatAmount(c.amount)
  return (
    <li className="space-y-2 rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground tabular-nums">{formatConvictionDate(c.date)}</span>
        <Badge variant="outline">{NATURE_LABELS[c.nature]}</Badge>
        <Badge variant={c.status === 'final' ? 'secondary' : 'outline'}>{STATUS_LABELS[c.status]}</Badge>
      </div>
      <p className="font-medium">{c.title}</p>
      <p className="text-muted-foreground">{c.offence}</p>
      <p>{c.description}</p>
      {(prison || ineligibility || amount || c.otherPenalty) && (
        <Fields>
          {prison && <Field label="Prison">{prison}</Field>}
          {amount && <Field label={c.nature === 'criminal' ? 'Amende' : 'Montant'}>{amount}</Field>}
          {ineligibility && <Field label="Inéligibilité">{ineligibility}</Field>}
          {c.otherPenalty && <Field label="Autre">{c.otherPenalty}</Field>}
        </Fields>
      )}
      {c.amnesty && <p className="font-medium">Amnistiée : {c.amnesty}</p>}
      {c.status !== 'final' && <p className="text-xs text-muted-foreground">Recours en cours à la date de la source.</p>}
      <p className="text-xs">
        Source : <ExternalLink href={c.source.url}>{c.source.label}</ExternalLink>
      </p>
    </li>
  )
}

/** Content of the "Condamnations" tab, newest first. Without any decision it says so, since absence proves nothing */
export function Convictions({ convictions = [] }: { convictions?: Conviction[] }) {
  return (
    <div className="space-y-3 py-4">
      {convictions.length ? (
        <ol className="space-y-2">
          {convictions.map((c) => (
            <Decision key={c.date + c.title} conviction={c} />
          ))}
        </ol>
      ) : (
        <MissingData title="Aucune décision recensée" />
      )}
      <ConvictionsCaveat />
    </div>
  )
}
