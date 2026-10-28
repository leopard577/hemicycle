import { Badge } from '@/components/ui/badge'
import { age, formatDate } from '@/lib/format'
import type { Senator } from '@/types'
import { ExternalLink, Field, Fields, Section } from './parts'

/** "Profil" tab of a senator */
export function SenatorProfile({ senator }: { senator: Senator }) {
  const feminine = senator.honorific === 'Mme'
  const born = formatDate(senator.birthDate)

  return (
    <div className="divide-y">
      <Section title="Circonscription">
        <p>
          {senator.constituency}
          {senator.constituencyCode && ` (${senator.constituencyCode})`}
        </p>
        {senator.series && <p className="text-muted-foreground">Série {senator.series} du renouvellement du Sénat</p>}
      </Section>

      <Section title="Mandat">
        <Fields>
          <Field label="En fonction depuis">{formatDate(senator.startDate)}</Field>
          {senator.bureauRole && <Field label="Bureau du Sénat">{senator.bureauRole}</Field>}
          {senator.groupRole && <Field label="Rôle dans le groupe">{senator.groupRole}</Field>}
          {senator.affiliation && <Field label="Lien avec le groupe">{senator.affiliation}</Field>}
          {senator.seat !== null && <Field label="Place dans l'hémicycle">n° {senator.seat}</Field>}
        </Fields>
      </Section>

      {senator.committees.length > 0 && (
        <Section title="Commissions">
          <ul className="space-y-1.5">
            {senator.committees.map((c) => (
              <li key={c.label}>
                {c.label.charAt(0).toUpperCase() + c.label.slice(1)}
                {c.role !== 'Membre' && (
                  <Badge variant="secondary" className="ml-2">
                    {c.role}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Biographie">
        <Fields>
          {born && (
            <Field label={feminine ? 'Née le' : 'Né le'}>
              {born} ({age(senator.birthDate)} ans)
            </Field>
          )}
          {senator.profession && <Field label="Profession">{senator.profession}</Field>}
        </Fields>
      </Section>

      <Section title="Contact">
        <ul className="space-y-1.5">
          {senator.email && (
            <li>
              <ExternalLink href={`mailto:${senator.email}`}>{senator.email}</ExternalLink>
            </li>
          )}
          {senator.twitter && (
            <li>
              <ExternalLink href={`https://x.com/${senator.twitter.replace(/^@/, '')}`}>{senator.twitter}</ExternalLink>
            </li>
          )}
          {senator.senatPage && (
            <li>
              <ExternalLink href={senator.senatPage}>Fiche sur senat.fr</ExternalLink>
            </li>
          )}
        </ul>
      </Section>
    </div>
  )
}
