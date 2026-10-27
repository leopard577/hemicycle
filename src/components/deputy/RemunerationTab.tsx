import { formatEuro } from '@/lib/format'
import type { Baremes, Depute } from '@/types'
import { ExternalLink, Field, Fields, MissingData, Note, Section } from './parts'

export function RemunerationTab({ depute, baremes }: { depute: Depute; baremes: Baremes }) {
  const { indemnite } = baremes
  const speciales = depute.indemnitesSpeciales
  const totalBrut = indemnite.brut + speciales.reduce((sum, s) => sum + s.montant, 0)

  return (
    <div className="divide-y">
      <Section title="Indemnité parlementaire (par mois)">
        <Fields>
          <Field label="Indemnité de base">{formatEuro(indemnite.base)}</Field>
          <Field label="Indemnité de résidence">{formatEuro(indemnite.residence)}</Field>
          <Field label="Indemnité de fonction">{formatEuro(indemnite.fonction)}</Field>
          <Field label="Total brut" strong>
            {formatEuro(indemnite.brut)}
          </Field>
          <Field label="Net, avant impôt" strong>
            {formatEuro(indemnite.net)}
          </Field>
        </Fields>
        <Note>Montant identique pour tous les députés.</Note>
      </Section>

      <Section title="Indemnités spéciales (par mois)">
        {speciales.length === 0 ? (
          <Note>Aucune fonction ouvrant droit à une indemnité spéciale (présidence, questure, Bureau…).</Note>
        ) : (
          <>
            <Fields>
              {speciales.map((s) => (
                <Field key={s.libelle + s.organe} label={s.libelle}>
                  {formatEuro(s.montant)} brut
                </Field>
              ))}
              <Field label="Total brut mensuel" strong>
                {formatEuro(totalBrut)}
              </Field>
            </Fields>
            {speciales.length > 1 && (
              <Note>La fiche officielle ne précise pas les règles de cumul entre indemnités spéciales.</Note>
            )}
            <Note>Ces indemnités sont imposées comme des traitements et salaires.</Note>
          </>
        )}
      </Section>

      <Section title="Frais de mandat (par mois)">
        <Fields>
          <Field label="Dotation de fonctionnement">{formatEuro(baremes.dotationFonctionnement)}</Field>
          <Field label="Crédit collaborateurs">{formatEuro(baremes.creditCollaborateurs)}</Field>
          <Field label="Collaborateurs listés">{depute.nbCollaborateurs}</Field>
        </Fields>
        <Note>
          {baremes.maxCollaborateurs} collaborateurs au maximum en même temps. La liste de l'Assemblée n'est pas datée et
          peut inclure des collaborateurs successifs.
        </Note>
        {depute.nbCollaborateurs === 0 && (
          <MissingData title="Aucun collaborateur déclaré">
            L'Assemblée ne recense aucun collaborateur pour ce député.
          </MissingData>
        )}
        <Note>
          Enveloppes identiques pour tous les députés : ce ne sont pas des revenus. La dotation couvre les dépenses liées au
          mandat ; le détail des dépenses de chaque député n'est pas publié en open data.
        </Note>
      </Section>

      <Section title="Cumul avec un mandat local">
        <Note>
          Les indemnités d'un mandat local s'ajoutent dans la limite de {formatEuro(baremes.plafondCumul)} par mois, au-delà
          elles sont écrêtées. Les montants perçus figurent dans l'onglet « Intérêts », s'ils ont été déclarés.
        </Note>
      </Section>

      <div className="py-4">
        <Note>
          Source : <ExternalLink href={baremes.source}>Assemblée nationale, fiche n° 7</ExternalLink> (mise à jour{' '}
          {baremes.miseAJour.split('-').reverse().join('/')}).
        </Note>
      </div>
    </div>
  )
}
