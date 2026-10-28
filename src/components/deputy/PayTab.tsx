import { Badge } from '@/components/ui/badge'
import { formatEuro } from '@/lib/format'
import type { Deputy, PayScales } from '@/types'
import { ExternalLink, Field, Fields, MissingData, Note, Section } from './parts'

const SameForAll = () => (
  <Badge variant="secondary" className="font-normal">
    Identique pour tous les députés
  </Badge>
)

export function PayTab({ deputy, payScales }: { deputy: Deputy; payScales: PayScales }) {
  const { allowance } = payScales
  const special = deputy.specialAllowances
  const totalGross = allowance.gross + special.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="divide-y">
      <Section title="Indemnités spéciales (par mois)">
        {special.length === 0 ? (
          <Note>Aucune fonction donnant droit à une indemnité en plus (présidence de l'Assemblée ou d'une commission, questeur, membre du Bureau…).</Note>
        ) : (
          <Fields>
            {special.map((s) => (
              <Field key={s.label + s.body} label={s.label}>
                {formatEuro(s.amount)} brut
              </Field>
            ))}
            <Field label="Total brut mensuel" strong>
              {formatEuro(totalGross)}
            </Field>
          </Fields>
        )}
      </Section>

      <Section title="Indemnité parlementaire (par mois)" aside={<SameForAll />}>
        <Fields>
          <Field label="Indemnité de base">{formatEuro(allowance.base)}</Field>
          <Field label="Indemnité de résidence">{formatEuro(allowance.residence)}</Field>
          <Field label="Indemnité de fonction">{formatEuro(allowance.office)}</Field>
          <Field label="Total brut" strong>
            {formatEuro(allowance.gross)}
          </Field>
          <Field label="Net, avant impôt" strong>
            {formatEuro(allowance.net)}
          </Field>
        </Fields>
      </Section>

      <Section title="Frais de mandat (par mois)" aside={<SameForAll />}>
        <Fields>
          <Field label="Avance de frais de mandat">{formatEuro(payScales.expenseAllowance)}</Field>
          <Field label="Crédit collaborateurs">{formatEuro(payScales.staffBudget)}</Field>
          <Field label="Collaborateurs listés">{deputy.staffCount}</Field>
        </Fields>
        <Note>Ces enveloppes ne sont pas des revenus.</Note>
        {deputy.staffCount === 0 && (
          <MissingData title="Aucun collaborateur déclaré">
            L'Assemblée ne recense aucun collaborateur pour ce député.
          </MissingData>
        )}
      </Section>
    </div>
  )
}

/** Notes for the tab, shown in "Précisions et sources" at the bottom of the panel */
export function PayNotes({ deputy, payScales }: { deputy: Deputy; payScales: PayScales }) {
  const special = deputy.specialAllowances
  return (
    <>
      {special.length > 1 && (
        <Note>La fiche officielle ne précise pas les règles de cumul entre indemnités spéciales.</Note>
      )}
      {special.length > 0 && <Note>Les indemnités spéciales sont imposées comme un salaire.</Note>}
      <Note>
        {payScales.maxStaff} collaborateurs au maximum en même temps. La liste de l'Assemblée n'est pas datée et peut
        inclure des collaborateurs successifs.
      </Note>
      <Note>
        L'avance de frais de mandat couvre les dépenses liées au mandat. Le détail des dépenses de chaque député n'est
        pas rendu public.
      </Note>
      <Note>
        Source : <ExternalLink href={payScales.source}>Assemblée nationale, fiche n° 7</ExternalLink> (mise à jour{' '}
        {payScales.updatedAt.split('-').reverse().join('/')}).
      </Note>
    </>
  )
}
