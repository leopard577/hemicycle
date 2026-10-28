import { Badge } from '@/components/ui/badge'
import { formatEuro } from '@/lib/format'
import type { Office } from '@/lib/offices'
import type { Parliamentarian, PayScales } from '@/types'
import { ExternalLink, Field, Fields, MissingData, Note, Section } from './parts'

interface TabProps {
  member: Parliamentarian
  payScales: PayScales
  office: Office
}

const SameForAll = ({ office }: { office: Office }) => (
  <Badge variant="secondary" className="font-normal">
    Identique pour tous les {office.plural}
  </Badge>
)

/** Staff count, published by the Assemblée only */
const staffCount = (m: Parliamentarian) => ('staffCount' in m && typeof m.staffCount === 'number' ? m.staffCount : null)

export function PayTab({ member, payScales, office }: TabProps) {
  const staff = staffCount(member)
  const { allowance } = payScales
  const special = member.specialAllowances
  const totalGross = allowance.gross + special.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="divide-y">
      <Section title="Indemnités spéciales (par mois)">
        {special.length === 0 ? (
          <Note>Aucune fonction donnant droit à une indemnité en plus ({office.specialRolesExample}).</Note>
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

      <Section title="Indemnité parlementaire (par mois)" aside={<SameForAll office={office} />}>
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

      <Section title="Frais de mandat (par mois)" aside={<SameForAll office={office} />}>
        <Fields>
          <Field label="Avance de frais de mandat">{formatEuro(payScales.expenseAllowance)}</Field>
          <Field label="Crédit collaborateurs">{formatEuro(payScales.staffBudget)}</Field>
          {staff !== null && <Field label="Collaborateurs listés">{staff}</Field>}
        </Fields>
        <Note>Ces enveloppes ne sont pas des revenus.</Note>
        {staff === 0 && (
          <MissingData title="Aucun collaborateur déclaré">
            L'Assemblée ne recense aucun collaborateur pour ce député.
          </MissingData>
        )}
      </Section>
    </div>
  )
}

/** Notes for the tab, shown in "Précisions et sources" at the bottom of the panel */
export function PayNotes({ member, payScales, office }: TabProps) {
  const special = member.specialAllowances
  return (
    <>
      {special.length > 1 && (
        <Note>La source officielle ne précise pas les règles de cumul entre indemnités spéciales.</Note>
      )}
      {special.length > 0 && <Note>Les indemnités spéciales sont imposées comme un salaire.</Note>}
      <Note>
        {payScales.maxStaff} collaborateurs au maximum en même temps.{office.staffNote && ` ${office.staffNote}`}
      </Note>
      <Note>{office.expensesNote}</Note>
      <Note>
        Source{payScales.sources.length > 1 && 's'} :{' '}
        {payScales.sources.map((source, i) => (
          <span key={source.url}>
            {i > 0 && ', '}
            <ExternalLink href={source.url}>{source.label}</ExternalLink>
          </span>
        ))}{' '}
        (mise à jour {payScales.updatedAt.split('-').reverse().join('/')}).
      </Note>
    </>
  )
}
