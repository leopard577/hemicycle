import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { declarationsDe, etatDeclaration, INTERETS } from '@/lib/declarations'
import { formatDate, formatEuro } from '@/lib/format'
import type { Depute, Interets, Participation, Revenu } from '@/types'
import { ExternalLink, MissingData, Note, Section } from './parts'

const RUBRIQUES: { key: 'activites' | 'mandats' | 'consultant' | 'dirigeant'; title: string }[] = [
  { key: 'activites', title: 'Activités professionnelles (5 dernières années)' },
  { key: 'mandats', title: 'Mandats électifs' },
  { key: 'consultant', title: 'Activités de conseil' },
  { key: 'dirigeant', title: "Fonctions de dirigeant d'organisme" },
]

export function InteretsTab({ depute }: { depute: Depute }) {
  const { interets, page } = depute.hatvp

  if (!interets) return <AbsenceInterets depute={depute} />

  return (
    <div className="divide-y">
      <div className="py-4">
        <Note>
          Déclaration d'intérêts et d'activités déposée le {formatDate(interets.dateDepot)}
          {interets.modificative && ' (modificative)'}. Montants déclarés par le député.
          {page && (
            <>
              {' '}
              <ExternalLink href={page}>Voir sur hatvp.fr</ExternalLink>
            </>
          )}
        </Note>
      </div>

      <Section title="Capital : participations financières">
        <Participations items={interets.participations} />
      </Section>

      {RUBRIQUES.map(({ key, title }) => (
        <Section key={key} title={title}>
          <Revenus items={interets[key]} />
        </Section>
      ))}
    </div>
  )
}

/** Explique pourquoi le contenu n'est pas disponible, selon le statut des dépôts */
function AbsenceInterets({ depute }: { depute: Depute }) {
  const derniere = declarationsDe(depute.hatvp.declarations, INTERETS)[0]
  const page = depute.hatvp.page

  if (!derniere)
    return (
      <div className="py-4">
        <MissingData missing title="Aucune déclaration d'intérêts enregistrée">
          La HATVP ne recense aucune déclaration d'intérêts et d'activités pour ce mandat.
        </MissingData>
      </div>
    )

  const { label, etat } = etatDeclaration(derniere)
  return (
    <div className="py-4">
      <MissingData title={etat === 'publiee' ? 'Contenu non disponible en open data' : label}>
        {etat === 'publiee'
          ? "La déclaration est publiée sur hatvp.fr, mais son contenu n'est pas dans les données ouvertes."
          : derniere.dateDepot
            ? `Déposée le ${formatDate(derniere.dateDepot)}, elle n'est pas encore publiée.`
            : "Elle n'est pas encore publiée."}
        {page && (
          <>
            {' '}
            <ExternalLink href={page}>Page HATVP</ExternalLink>
          </>
        )}
      </MissingData>
    </div>
  )
}

function Vide({ items }: { items: unknown[] | null }) {
  return items === null ? (
    <Badge variant="outline">Rubrique non renseignée</Badge>
  ) : (
    <Badge variant="secondary">Néant déclaré</Badge>
  )
}

function Participations({ items }: { items: Interets['participations'] }) {
  if (!items?.length) return <Vide items={items} />

  const total = items.reduce((sum, p) => sum + (p.evaluation ?? 0), 0)
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Société</TableHead>
            <TableHead className="text-right">Valeur</TableHead>
            <TableHead className="text-right">Capital</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p, i) => (
            <ParticipationRow key={`${p.societe}-${i}`} p={p} />
          ))}
        </TableBody>
      </Table>
      <p className="text-right font-semibold">Total déclaré : {formatEuro(total, { round: true })}</p>
    </>
  )
}

function ParticipationRow({ p }: { p: Participation }) {
  return (
    <TableRow>
      <TableCell className="whitespace-normal">
        <div>{p.societe}</div>
        <div className="text-xs text-muted-foreground">
          {[p.nombreParts && `${p.nombreParts} parts`, p.remuneration && `revenus : ${p.remuneration}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {p.evaluation === null ? '—' : formatEuro(p.evaluation, { round: true })}
      </TableCell>
      <TableCell className="text-right tabular-nums">{p.capitalDetenu ? `${p.capitalDetenu} %` : '—'}</TableCell>
    </TableRow>
  )
}

function Revenus({ items }: { items: Revenu[] | null }) {
  if (!items?.length) return <Vide items={items} />

  return (
    <ul className="space-y-3">
      {items.map((r, i) => (
        <li key={i} className="space-y-1">
          <div className="font-medium">{r.intitule ?? 'Intitulé non publié'}</div>
          <div className="text-xs text-muted-foreground">
            {[r.organisme, periode(r)].filter(Boolean).join(' · ')}
          </div>
          {r.montants.length ? (
            <div className="flex flex-wrap gap-1.5">
              {r.montants.map((m) => (
                <Badge key={m.annee} variant="outline" className="tabular-nums">
                  {m.annee} · {m.montant === null ? 'non publié' : formatEuro(m.montant, { round: true })}
                </Badge>
              ))}
              {r.brutNet && <span className="text-xs text-muted-foreground">({r.brutNet.toLowerCase()})</span>}
            </div>
          ) : (
            <Note>Aucun montant déclaré.</Note>
          )}
        </li>
      ))}
    </ul>
  )
}

function periode(r: Revenu) {
  if (r.debut && r.fin) return `${r.debut} – ${r.fin}`
  if (r.debut) return `depuis ${r.debut}`
  return null
}
