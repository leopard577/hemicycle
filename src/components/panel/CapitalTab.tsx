import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { asPublished, declarationsOf, declarationStatus, INTERESTS, plainGrossNet, REDACTED } from '@/lib/declarations'
import { formatDate, formatEuro } from '@/lib/format'
import { pendingDeadline } from '@/lib/money'
import type { Office } from '@/lib/offices'
import type { Holding, Income, Interests, Official } from '@/types'
import { cn } from '@/lib/utils'
import { ExternalLink, MissingData, Note, Section } from './parts'

const SECTIONS: { key: 'jobs' | 'mandates' | 'consulting' | 'directorships'; title: string }[] = [
  { key: 'jobs', title: 'Activités professionnelles (5 dernières années)' },
  { key: 'mandates', title: 'Mandats électifs' },
  { key: 'consulting', title: 'Activités de conseil' },
  { key: 'directorships', title: 'Fonctions de dirigeant (sociétés, associations…)' },
]

interface TabProps {
  member: Official
  office: Office
}

/** "Capital" tab: company holdings listed in the declaration of interests */
export function CapitalTab({ member, office }: TabProps) {
  const { interests, page } = member.hatvp

  if (!interests) return <MissingInterests member={member} office={office} />

  return (
    <div className="divide-y">
      <div className="py-4">
        <Note>
          Parts de sociétés listées dans sa déclaration d'intérêts et d'activités du {formatDate(interests.filedAt)}
          {interests.amended && ' (mise à jour)'}, aux valeurs que l'élu a lui-même déclarées. Les biens immobiliers,
          l'épargne et les autres biens relèvent de la déclaration de patrimoine, que l'application ne reprend pas.
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
    </div>
  )
}

/** Every activity section of the declaration of interests, in full: shown at the end of the "Cumuls" tab */
export function DeclaredActivities({ interests }: { interests: Interests }) {
  return (
    <Section title="Sa déclaration, rubrique par rubrique">
      <Note>
        Déclaration d'intérêts et d'activités du {formatDate(interests.filedAt)}
        {interests.amended && ' (mise à jour)'}, telle que publiée par la HATVP.
      </Note>
      <div className="space-y-3 pt-2">
        {SECTIONS.map(({ key, title }) => {
          const items = interests[key]
          return (
            <section key={key} className="overflow-hidden rounded-lg border">
              {/* An empty rubrique is just its header, with "néant" or "not filled" on the right */}
              <header
                className={cn(
                  'flex items-center justify-between gap-x-3 gap-y-1 bg-muted/60 px-3 py-2',
                  items?.length ? 'border-b' : 'flex-wrap',
                )}
              >
                <h4 className="text-sm font-semibold">{title}</h4>
                {items?.length ? (
                  <Badge variant="outline" className="bg-background tabular-nums">
                    {items.length}
                  </Badge>
                ) : (
                  <Empty items={items} />
                )}
              </header>
              {items?.length ? <IncomeList items={items} /> : null}
            </section>
          )
        })}
      </div>
    </Section>
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

  const { label, status } = declarationStatus(latest, office)
  return (
    <div className="py-4">
      <MissingData title={status === 'published' ? 'Détail non disponible' : label}>
        {status === 'published'
          ? "La déclaration est publiée sur hatvp.fr, mais son contenu ne figure pas dans les fichiers open data de la HATVP."
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
      <p className="text-right font-semibold">Total des valeurs déclarées (calcul) : {formatEuro(total)}</p>
    </>
  )
}

function HoldingRow({ holding: h }: { holding: Holding }) {
  return (
    <TableRow>
      <TableCell className="whitespace-normal">
        <div>{asPublished(h.company)}</div>
        <div className="text-xs text-muted-foreground">
          {[h.shareCount && `parts : ${h.shareCount}`, h.income && `revenus : ${h.income}`].filter(Boolean).join(' · ')}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {h.value === null ? (h.valueText ?? 'Non renseignée') : formatEuro(h.value)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {h.capitalShare ? (h.capitalShare.includes(REDACTED) ? h.capitalShare : `${h.capitalShare} %`) : '—'}
      </TableCell>
    </TableRow>
  )
}

/** Entries of one rubrique: title, organisation and period, then the amount declared for each year */
function IncomeList({ items }: { items: Income[] }) {
  return (
    <ul className="divide-y">
      {items.map((income, i) => (
        <li key={i} className="space-y-1.5 px-3 py-2.5">
          <div>
            <div className="text-sm font-medium">{asPublished(income.title)}</div>
            <div className="text-xs text-muted-foreground">
              {[income.organization, period(income)].filter(Boolean).join(' · ')}
            </div>
          </div>
          {income.amounts.length ? (
            <div className="space-y-0.5">
              {income.grossNet && (
                <div className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                  {plainGrossNet(income.grossNet)
                    ? `Montants ${plainGrossNet(income.grossNet)}s`
                    : `Brut ou net : ${income.grossNet}`}
                </div>
              )}
              <dl className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm tabular-nums">
                {income.amounts.map((m) => (
                  <div key={m.year} className={cn('flex gap-1.5', !m.amount && 'text-muted-foreground')}>
                    <dt className="text-muted-foreground">{m.year}</dt>
                    <dd className={cn(m.amount && 'font-medium')}>
                      {m.amount === null ? (m.text ?? 'non renseigné') : formatEuro(m.amount)}
                    </dd>
                  </div>
                ))}
              </dl>
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
