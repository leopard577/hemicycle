import { Badge } from '@/components/ui/badge'
import { age, formatDate } from '@/lib/format'
import type { Depute } from '@/types'
import { ExternalLink, Field, Fields, Section } from './parts'

export function ProfilTab({ depute }: { depute: Depute }) {
  const feminine = depute.civ === 'Mme'
  const born = formatDate(depute.dateNais)

  return (
    <div className="divide-y">
      <Section title="Circonscription">
        <p>
          {depute.departement} ({depute.numDepartement}) — {depute.numCirco}
          <sup>{depute.numCirco === '1' ? 're' : 'e'}</sup> circonscription
        </p>
        {depute.region && <p className="text-muted-foreground">{depute.region}</p>}
      </Section>

      <Section title="Mandat">
        <Fields>
          <Field label="En fonction depuis">{formatDate(depute.dateDebut)}</Field>
          {depute.qualiteGroupe && !depute.qualiteGroupe.startsWith('Membre') && (
            <Field label="Rôle dans le groupe">{depute.qualiteGroupe.replace(/ (du|au)$/, '')}</Field>
          )}
          {depute.parti && <Field label="Parti de rattachement">{depute.parti}</Field>}
          {depute.placeHemicycle && <Field label="Place dans l'hémicycle">n° {depute.placeHemicycle}</Field>}
        </Fields>
      </Section>

      {depute.commissions.length > 0 && (
        <Section title="Commission">
          <ul className="space-y-1.5">
            {depute.commissions.map((c) => (
              <li key={c.libelle}>
                {c.libelle}
                {c.qualite !== 'Membre' && (
                  <Badge variant="secondary" className="ml-2">
                    {c.qualite}
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
              {depute.villeNais && ` à ${depute.villeNais}`} ({age(depute.dateNais)} ans)
            </Field>
          )}
          {depute.profession && <Field label="Profession">{depute.profession}</Field>}
        </Fields>
      </Section>

      <Section title="Contact">
        <ul className="space-y-1.5">
          {depute.email && (
            <li>
              <ExternalLink href={`mailto:${depute.email}`}>{depute.email}</ExternalLink>
            </li>
          )}
          {depute.twitter && (
            <li>
              <ExternalLink href={`https://x.com/${depute.twitter.replace(/^@/, '')}`}>{depute.twitter}</ExternalLink>
            </li>
          )}
          {depute.site && (
            <li>
              <ExternalLink href={depute.site.startsWith('http') ? depute.site : `https://${depute.site}`}>
                {depute.site}
              </ExternalLink>
            </li>
          )}
          <li>
            <ExternalLink href={`https://www.assemblee-nationale.fr/dyn/deputes/${depute.id}`}>
              Fiche sur assemblee-nationale.fr
            </ExternalLink>
          </li>
        </ul>
      </Section>
    </div>
  )
}
