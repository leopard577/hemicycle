import { Badge } from '@/components/ui/badge'
import { age, formatDate } from '@/lib/format'
import type { Deputy } from '@/types'
import { ExternalLink, Field, Fields, Section } from './parts'

export function ProfileTab({ deputy }: { deputy: Deputy }) {
  const feminine = deputy.honorific === 'Mme'
  const born = formatDate(deputy.birthDate)

  return (
    <div className="divide-y">
      <Section title="Circonscription">
        <p>
          {deputy.department} ({deputy.departmentCode}) — {deputy.constituency}
          <sup>{deputy.constituency === '1' ? 're' : 'e'}</sup> circonscription
        </p>
        {deputy.region && <p className="text-muted-foreground">{deputy.region}</p>}
      </Section>

      <Section title="Mandat">
        <Fields>
          <Field label="En fonction depuis">{formatDate(deputy.startDate)}</Field>
          {deputy.groupRole && !deputy.groupRole.startsWith('Membre') && (
            <Field label="Rôle dans le groupe">{deputy.groupRole.replace(/ (du|au)$/, '')}</Field>
          )}
          {deputy.party && <Field label="Parti de rattachement">{deputy.party}</Field>}
          {deputy.seat && <Field label="Place dans l'hémicycle">n° {deputy.seat}</Field>}
        </Fields>
      </Section>

      {deputy.committees.length > 0 && (
        <Section title="Commission">
          <ul className="space-y-1.5">
            {deputy.committees.map((c) => (
              <li key={c.label}>
                {c.label}
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
              {born}
              {deputy.birthPlace && ` à ${deputy.birthPlace}`} ({age(deputy.birthDate)} ans)
            </Field>
          )}
          {deputy.profession && <Field label="Profession">{deputy.profession}</Field>}
        </Fields>
      </Section>

      <Section title="Contact">
        <ul className="space-y-1.5">
          {deputy.email && (
            <li>
              <ExternalLink href={`mailto:${deputy.email}`}>{deputy.email}</ExternalLink>
            </li>
          )}
          {deputy.twitter && (
            <li>
              <ExternalLink href={`https://x.com/${deputy.twitter.replace(/^@/, '')}`}>{deputy.twitter}</ExternalLink>
            </li>
          )}
          {deputy.website && (
            <li>
              <ExternalLink href={deputy.website.startsWith('http') ? deputy.website : `https://${deputy.website}`}>
                {deputy.website}
              </ExternalLink>
            </li>
          )}
          <li>
            <ExternalLink href={`https://www.assemblee-nationale.fr/dyn/deputes/${deputy.id}`}>
              Fiche sur assemblee-nationale.fr
            </ExternalLink>
          </li>
        </ul>
      </Section>
    </div>
  )
}
