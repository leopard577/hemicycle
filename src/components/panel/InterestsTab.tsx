import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { declarationsOf, declarationStatus, INTERESTS } from '@/lib/declarations'
import { formatDate, formatEuro } from '@/lib/format'
import { pendingDeadline } from '@/lib/money'
import type { Office } from '@/lib/offices'
import type { Holding, Income, Interests, Parliamentarian } from '@/types'
import { ExternalLink, MissingData, Note, Section } from './parts'

const SECTIONS: { key: 'jobs' | 'mandates' | 'consulting' | 'directorships'; title: string }[] = [
  { key: 'jobs', title: 'Activités professionnelles (5 dernières années)' },
  { key: 'mandates', title: 'Mandats électifs' },
  { key: 'consulting', title: 'Activités de conseil' },
  { key: 'directorships', title: 'Fonctions de dirigeant (sociétés, associations…)' },
]

interface TabProps {
  member: Parliamentarian
  office: Office
}

export function InterestsTab({ member, office }: TabProps) {
  const { interests, page } = member.hatvp

  if (!interests) return <MissingInterests member={member} office={office} />

  return (
    <div className="divide-y">
      <div className="py-4">
        <Note>
          Déclaration d'intérêts et d'activités déposée le {formatDate(interests.filedAt)}
          {interests.amended && ' (mise à jour)'}. Les montants sont ceux que l'élu a lui-même déclarés.
          {page && (
            <>
              {' '}
              <ExternalLink href={page}>Voir sur hatvp.fr</ExternalLink>
            </>
          )}
        </Note>
      </div>

      <Section title="Parts détenues dans des sociétés">
        <Holdings items={interests.holdings} />
      </Section>

      {SECTIONS.map(({ key, title }) => (
        <Section key={key} title={title}>
          <IncomeList items={interests[key]} />
        </Section>
      ))}
    </div>
  )
}

/** Explains why the content is unavailable, from the filing status */
function MissingInterests({ member, office }: TabProps) {
  const declarations = declarationsOf(member.hatvp.declarations, INTERESTS)
  const latest = declarations[0]
  const page = member.hatvp.page
  const due = pendingDeadline(member.startDate)

  // Newly in office and still within the legal deadline: nothing is missing yet
  if (due && !declarations.some((d) => (d.filedAt ?? '') >= member.startDate))
    return (
      <div className="py-4">
        <MissingData title="Déclaration attendue">
          En fonction depuis le {formatDate(member.startDate)}, {office.the(member.honorific === 'Mme')} a jusqu'au{' '}
          {formatDate(due)} pour déposer sa déclaration d'intérêts et d'activités auprès de la HATVP.
        </MissingData>
      </div>
    )

  if (!latest)
    return (
      <div className="py-4">
        <MissingData missing title="Aucune déclaration d'intérêts enregistrée">
          La HATVP ne recense aucune déclaration d'intérêts et d'activités pour ce mandat.
        </MissingData>
      </div>
    )

  const { label, status } = declarationStatus(latest)
  return (
    <div className="py-4">
      <MissingData title={status === 'published' ? 'Détail pas encore disponible' : label}>
        {status === 'published'
          ? "La déclaration est publiée sur hatvp.fr, mais son contenu ne figure pas encore dans les fichiers téléchargeables de la HATVP."
          : latest.filedAt
            ? `Déposée le ${formatDate(latest.filedAt)}, elle n'est pas encore publiée.`
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

/** `null` = section left empty, `[]` = "néant" declared: the two are shown differently */
function Empty({ items }: { items: unknown[] | null }) {
  return items === null ? (
    <Badge variant="outline">Partie non remplie</Badge>
  ) : (
    <Badge variant="secondary">Aucun, selon sa déclaration</Badge>
  )
}

function Holdings({ items }: { items: Interests['holdings'] }) {
  if (!items?.length) return <Empty items={items} />

  const total = items.reduce((sum, h) => sum + (h.value ?? 0), 0)
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Société</TableHead>
            <TableHead className="text-right">Valeur</TableHead>
            <TableHead className="text-right">Part du capital</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((h, i) => (
            <HoldingRow key={`${h.company}-${i}`} holding={h} />
          ))}
        </TableBody>
      </Table>
      <p className="text-right font-semibold">Total déclaré : {formatEuro(total, { round: true })}</p>
    </>
  )
}

function HoldingRow({ holding: h }: { holding: Holding }) {
  return (
    <TableRow>
      <TableCell className="whitespace-normal">
        <div>{h.company}</div>
        <div className="text-xs text-muted-foreground">
          {[h.shareCount && `${h.shareCount} parts`, h.income && `revenus : ${h.income}`].filter(Boolean).join(' · ')}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {h.value === null ? '—' : formatEuro(h.value, { round: true })}
      </TableCell>
      <TableCell className="text-right tabular-nums">{h.capitalShare ? `${h.capitalShare} %` : '—'}</TableCell>
    </TableRow>
  )
}

function IncomeList({ items }: { items: Income[] | null }) {
  if (!items?.length) return <Empty items={items} />

  return (
    <ul className="space-y-3">
      {items.map((income, i) => (
        <li key={i} className="space-y-1">
          <div className="font-medium">{income.title ?? 'Intitulé non publié'}</div>
          <div className="text-xs text-muted-foreground">
            {[income.organization, period(income)].filter(Boolean).join(' · ')}
          </div>
          {income.amounts.length ? (
            <div className="flex flex-wrap gap-1.5">
              {income.amounts.map((m) => (
                <Badge key={m.year} variant="outline" className="tabular-nums">
                  {m.year} · {m.amount === null ? 'non publié' : formatEuro(m.amount, { round: true })}
                </Badge>
              ))}
              {income.grossNet && <span className="text-xs text-muted-foreground">({income.grossNet.toLowerCase()})</span>}
            </div>
          ) : (
            <Note>Aucun montant déclaré.</Note>
          )}
        </li>
      ))}
    </ul>
  )
}

function period(i: Income) {
  if (i.start && i.end) return `${i.start} – ${i.end}`
  if (i.start) return `depuis ${i.start}`
  return null
}
