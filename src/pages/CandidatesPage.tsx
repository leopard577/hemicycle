import { useEffect, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { ExternalLink, Field, Fields, MissingData, Note } from '@/components/panel/parts'
import { SiteFooter } from '@/components/SiteFooter'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatDate, formatEuro } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Candidate, CandidatesDataset, SponsorOffice } from '@/types'

const percent = (share: number) =>
  share.toLocaleString('fr-FR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** "4,75 %", "47,5 %", "5 %" */
const rate = (share: number) => share.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 })
const count = (n: number) => n.toLocaleString('fr-FR')
/** "× 77,7", but "× 0,97" near 1, so a value just under the reference does not read as equal to it */
const multiple = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: n < 2 ? 2 : 1 })

const SPONSOR_OFFICES: { id: SponsorOffice; label: string; fill: string; bg: string }[] = [
  { id: 'mayor', label: 'Maires', fill: 'fill-sky-600', bg: 'bg-sky-600' },
  { id: 'departmental', label: 'Élus départementaux', fill: 'fill-teal-500', bg: 'bg-teal-500' },
  { id: 'regional', label: 'Élus régionaux', fill: 'fill-violet-500', bg: 'bg-violet-500' },
  { id: 'parliament', label: 'Parlementaires', fill: 'fill-amber-500', bg: 'bg-amber-500' },
  { id: 'other', label: 'Autres élus', fill: 'fill-zinc-400', bg: 'bg-zinc-400' },
]

/** "Candidats" page: the 2022 presidential candidates, their sponsorships, votes and what the State refunded */
export function CandidatesPage() {
  const [data, setData] = useState<CandidatesDataset | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/candidates.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<CandidatesDataset>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error)
    return (
      <p className="flex-1 p-12 text-center text-muted-foreground">
        Impossible de charger les données ({error}). Lancez <code>npm run data</code>.
      </p>
    )
  if (!data) return <p className="flex-1 p-12 text-center text-muted-foreground">Chargement…</p>

  const { election, candidates } = data
  const { funding, datasets } = election
  const [first, second] = election.rounds
  const totalRefund = candidates.reduce((sum, c) => sum + c.account.refund, 0)
  const totalSpending = candidates.reduce((sum, c) => sum + c.account.retained.spending, 0)
  const maxSpending = Math.max(...candidates.map((c) => c.account.retained.spending))

  return (
    <>
      <div>
        <div className="mx-auto w-full max-w-5xl px-6 py-5">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">{election.label}</p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">Les candidats</h1>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-6 py-8">
        {/* Before the official list, calling someone a candidate is a claim, not a fact: no 2027 name here */}
        <MissingData title="Et l'élection présidentielle de 2027 ?">
          Une page lui sera consacrée dès que les données officielles seront publiques : les parrainages et la liste
          des candidats par le Conseil constitutionnel, les résultats par le ministère de l'Intérieur, puis les comptes
          de campagne par la CNCCFP, plusieurs mois après le scrutin. D'ici là, personne n'est présenté ici comme
          candidat : seule la liste officielle en fait foi.
        </MissingData>

        <section className="space-y-6">
          <p className="mx-auto max-w-2xl text-center text-lg text-balance">
            Pour l'élection présidentielle de 2022, l'État doit{' '}
            <strong className="font-heading text-2xl text-red-700 tabular-nums dark:text-red-400">
              {formatEuro(totalRefund, { round: true })}
            </strong>{' '}
            aux {candidates.length} candidats au titre du remboursement de leurs frais de campagne, sur{' '}
            {formatEuro(totalSpending, { compact: true })} de dépenses retenues par la CNCCFP.
          </p>
          <p className="mx-auto max-w-2xl text-center text-sm text-balance text-muted-foreground">
            Soit {formatEuro(totalRefund / first.cast, { round: false })} par suffrage exprimé au premier tour
            (calcul). La campagne officielle (affiches, professions de foi, bulletins), payée directement par l'État,
            n'est pas comptée.
          </p>

          <Timeline data={data} />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-semibold">Ce que chaque campagne a coûté</h2>
            <p className="text-sm text-muted-foreground">
              Dépenses retenues par la CNCCFP et part remboursée par l'État, par ordre de voix au premier tour.
              Choisissez un candidat pour le détail de son compte.
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-600" />
              Remboursé par l'État
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              Payé par le candidat, ses donateurs et ses partis
            </li>
          </ul>

          <ul className="divide-y rounded-lg border">
            {candidates.map((c) => (
              <CandidateRow key={c.id} candidate={c} maxSpending={maxSpending} data={data} />
            ))}
          </ul>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-heading text-xl font-semibold">Les parrainages</h2>
            <p className="text-sm">
              Pour être candidat, il faut au moins 500 parrainages d'élus, venus d'au moins 30 départements ou
              collectivités d'outre-mer. Le Conseil constitutionnel en a validé{' '}
              <strong>{count(data.sponsorshipsTotal)}</strong> et les a tous publiés en open data :{' '}
              <ExternalLink href={datasets.sponsorships.url}>parrainages sur data.gouv.fr</ExternalLink>.
            </p>
            <p className="text-sm text-muted-foreground">
              {count(data.otherSponsored.people)} autres personnes ont reçu {count(data.otherSponsored.sponsorships)}{' '}
              parrainages sans figurer sur la liste officielle des candidats : elles ne sont pas nommées ici.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {SPONSOR_OFFICES.map((o) => (
                <li key={o.id} className="flex items-center gap-1.5">
                  <span className={cn('size-2.5 rounded-full', o.bg)} />
                  {o.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-xl font-semibold">Les règles du remboursement</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>
                Dépenses plafonnées à {formatEuro(funding.ceiling.firstRound, { round: true })} pour un candidat du
                premier tour, {formatEuro(funding.ceiling.secondRound, { round: true })} pour un candidat du second.
              </li>
              <li>
                L'État rembourse au plus {rate(funding.refundRate.low)} du plafond, ou{' '}
                {rate(funding.refundRate.high)} au-delà de {rate(funding.highRateThreshold)} des suffrages
                exprimés au premier tour, sans dépasser l'apport personnel du candidat.
              </li>
              <li>
                Une avance de {formatEuro(funding.advance, { round: true })} est versée à chaque candidat dès la
                publication de la liste ; elle est comprise dans le remboursement.
              </li>
              <li>
                Les dépenses irrégulières (affichage hors des panneaux officiels, véhicules floqués…) ne sont pas
                remboursées, et la CNCCFP peut réduire le remboursement en cas d'irrégularité.
              </li>
            </ul>
            <Note>
              Sources :{' '}
              {funding.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ' · '}
                  <ExternalLink href={s.url}>{s.label}</ExternalLink>
                </span>
              ))}
            </Note>
          </div>
        </section>

        <NetWorthChart data={data} />

        <section className="space-y-2 text-sm text-muted-foreground">
          <h2 className="font-heading text-xl font-semibold text-foreground">Participation</h2>
          <p>
            Premier tour, le {formatDate(first.date)} : {count(first.voters)} votants sur {count(first.registered)}{' '}
            inscrits, {count(first.cast)} suffrages exprimés.{' '}
            {second &&
              `Second tour, le ${formatDate(second.date)} : ${count(second.voters)} votants, ${count(second.blank)} votes blancs et ${count(second.invalid)} nuls, ${count(second.cast)} suffrages exprimés.`}{' '}
            Résultats détaillés sur data.gouv.fr : <ExternalLink href={datasets.firstRound.url}>premier tour</ExternalLink>,{' '}
            <ExternalLink href={datasets.secondRound.url}>second tour</ExternalLink>.
          </p>
        </section>
      </main>

      <SiteFooter>
        Données publiques : Conseil constitutionnel (liste des candidats, parrainages, résultats), ministère de
        l'Intérieur (résultats) et décisions de la CNCCFP publiées au Journal officiel, extraites le{' '}
        {new Date(data.generatedAt).toLocaleDateString('fr-FR')}.
      </SiteFooter>
    </>
  )
}

/** Net worth reported by the press in March 2022, with why the declarations themselves cannot be linked */
function NetWorthChart({ data }: { data: CandidatesDataset }) {
  const { source, removal, publishedFrom, publishedUntil, households } = data.election.pressNetWorth
  // The two household references are drawn among the candidates, at their rank
  const rows: { id: string; label: string; amount: number; reference: 'median' | 'mean' | null }[] = [
    ...data.candidates.map((c) => ({
      id: c.id,
      label: `${c.firstName} ${c.lastName}`,
      amount: c.pressNetWorth,
      reference: null,
    })),
    { id: 'median', label: 'Ménage médian', amount: households.median, reference: 'median' as const },
    { id: 'mean', label: 'Ménage moyen', amount: households.mean, reference: 'mean' as const },
  ].sort((a, b) => b.amount - a.amount)
  const max = rows[0].amount
  const grid =
    'grid grid-cols-[7rem_1fr_4rem_2.75rem_2.75rem] items-center gap-2 sm:grid-cols-[14rem_1fr_6rem_5rem_5rem] sm:gap-3'
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-semibold">Patrimoine net déclaré, selon la presse</h2>
        <p className="text-sm text-muted-foreground">
          Biens moins dettes, d'après les déclarations de patrimoine publiées le {formatDate(publishedFrom)}, tels que
          rapportés et arrondis par {source.publisher}, comparés au patrimoine net des ménages en France au début de{' '}
          {households.date} : la moitié des ménages possèdent plus de{' '}
          {formatEuro(households.median, { round: true })} (médiane), et un ménage possède en moyenne{' '}
          {formatEuro(households.mean, { round: true })} (moyenne, tirée vers le haut par les plus gros patrimoines).
        </p>
      </div>

      <div className="space-y-2">
        <div className={cn(grid, 'text-xs text-muted-foreground')}>
          <span className="col-span-3" />
          <span className="text-right">× médiane</span>
          <span className="text-right">× moyenne</span>
        </div>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className={cn(
                grid,
                'text-sm',
                r.reference === 'median' && 'rounded-md bg-amber-500/10 py-1 font-medium',
                r.reference === 'mean' && 'rounded-md bg-violet-500/10 py-1 font-medium',
              )}
            >
              <span className="truncate">{r.label}</span>
              <svg
                viewBox={`0 0 ${max} 1`}
                preserveAspectRatio="none"
                className="block h-3 w-full overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <rect
                  x={0}
                  y={0}
                  width={r.amount}
                  height={1}
                  className={
                    r.reference === 'median' ? 'fill-amber-500' : r.reference === 'mean' ? 'fill-violet-500' : 'fill-sky-600'
                  }
                />
              </svg>
              <span className="text-right font-medium tabular-nums">{formatEuro(r.amount, { compact: true })}</span>
              <span className="text-right text-xs text-muted-foreground tabular-nums">
                {r.reference ? '' : `× ${multiple(r.amount / households.median)}`}
              </span>
              <span className="text-right text-xs text-muted-foreground tabular-nums">
                {r.reference ? '' : `× ${multiple(r.amount / households.mean)}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Note>
        « × » : patrimoine du candidat divisé par celui du ménage médian ou moyen (calcul). Les chiffres de l'Insee
        portent sur un ménage (toutes les personnes d'un même logement) au début de {households.date}, ceux des
        candidats sur leur propre déclaration en mars 2022 : la comparaison donne un ordre de grandeur. Source :{' '}
        <ExternalLink href={households.source.url}>{households.source.label}</ExternalLink>.
      </Note>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
        <p>
          Source :{' '}
          <ExternalLink href={source.url}>
            {source.publisher}, « {source.title} », {formatDate(source.date)}
          </ExternalLink>
          . Ces montants sont ceux de l'article : ils ne sont pas repris des déclarations elles-mêmes.
        </p>
        <p className="text-muted-foreground">
          Pourquoi pas la source officielle ? Les déclarations des candidats sont remises au Conseil constitutionnel et
          publiées sans contrôle, comme l'impose la loi du 6 novembre 1962, au moins quinze jours avant le premier
          tour. La HATVP les a mises en ligne le {formatDate(publishedFrom)} ; elles sont restées publiques jusqu'à
          la proclamation des résultats du premier tour, le {formatDate(publishedUntil)}, puis ont été retirées de
          son site, comme elle l'explique sur{' '}
          <ExternalLink href={removal}>sa page consacrée à l'élection</ExternalLink>. Seule la déclaration de
          patrimoine du candidat élu reste publique, au Journal officiel du 28 avril 2022.
        </p>
      </div>
    </section>
  )
}

/** Official steps of the election, each with its date and, when there is one, the text that settled it */
function Timeline({ data }: { data: CandidatesDataset }) {
  const { decisions, rounds } = data.election
  const accounts = data.candidates.map((c) => c.account.decision)
  const published = [...new Set(accounts.map((d) => d.publishedAt))].sort()
  const steps = [
    { date: decisions.list.date, label: 'Liste officielle des candidats', link: decisions.list },
    { date: rounds[0].date, label: 'Premier tour', link: decisions.firstRound },
    { date: rounds[1]?.date, label: 'Second tour', link: decisions.secondRound },
    { date: accounts[0].date, label: 'Décisions de la CNCCFP sur les comptes', link: null },
    {
      date: published[0],
      label: `Publication au Journal officiel${published.length > 1 ? ` (et le ${formatDate(published.at(-1)!)})` : ''}`,
      link: null,
    },
  ].filter((s) => s.date)
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {steps.map((s) => (
        <li key={s.label} className="space-y-0.5 border-l-2 border-primary/40 pl-3 text-sm">
          <div className="font-medium tabular-nums">{formatDate(s.date)}</div>
          <div className="text-muted-foreground">
            {s.link ? (
              <a href={s.link.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                {s.label}
              </a>
            ) : (
              s.label
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function CandidateRow({
  candidate: c,
  maxSpending,
  data,
}: {
  candidate: Candidate
  maxSpending: number
  data: CandidatesDataset
}) {
  const { account } = c
  const rest = Math.max(account.retained.spending - account.refund, 0)
  return (
    <li>
      <Collapsible>
        <CollapsibleTrigger className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 text-left hover:bg-accent/50 sm:grid-cols-[14rem_1fr_auto]">
          <span className="min-w-0">
            <span className="block font-medium">
              {c.firstName} {c.lastName}
            </span>
            <span className="block text-xs text-muted-foreground tabular-nums">
              {percent(c.firstRound.share)} au 1er tour
              {c.secondRound && ` · ${percent(c.secondRound.share)} au 2nd`}
            </span>
          </span>
          <svg
            viewBox={`0 0 ${maxSpending} 1`}
            preserveAspectRatio="none"
            className="col-span-2 row-start-2 block h-3 w-full overflow-hidden rounded-full sm:col-span-1 sm:row-start-auto"
            aria-hidden
          >
            <rect x={0} y={0} width={account.refund} height={1} className="fill-red-600" />
            <rect x={account.refund} y={0} width={rest} height={1} className="fill-muted-foreground/30" />
          </svg>
          <span className="flex items-center gap-2 text-right">
            <span>
              <span className="block font-heading font-semibold tabular-nums">
                {formatEuro(account.refund, { round: true })}
              </span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                sur {formatEuro(account.retained.spending, { compact: true })}
              </span>
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <AccountDetail candidate={c} data={data} />
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

function AccountDetail({ candidate: c, data }: { candidate: Candidate; data: CandidatesDataset }) {
  const { account } = c
  const deductions = account.irregular + account.penalty
  const offices = SPONSOR_OFFICES.filter((o) => c.sponsorships.byOffice[o.id] > 0)
  const starts = offices.map((_, i) => offices.slice(0, i).reduce((sum, o) => sum + c.sponsorships.byOffice[o.id], 0))
  return (
    <div className="grid gap-6 border-t bg-muted/30 px-4 py-4 text-sm md:grid-cols-3">
      <div className="space-y-2">
        <h3 className="font-heading font-semibold">Dépenses</h3>
        <Fields>
          <Field label="Déclarées">{formatEuro(account.declared.spending, { round: true })}</Field>
          <Field label="Retenues" strong>
            {formatEuro(account.retained.spending, { round: true })}
          </Field>
          <Field label="Plafond">{formatEuro(account.ceiling, { round: true })}</Field>
        </Fields>
        <h3 className="pt-2 font-heading font-semibold">Recettes retenues</h3>
        <Fields>
          <Field label="Apport personnel">{formatEuro(account.personal, { round: true })}</Field>
          {account.partyPayments > 0 && (
            <Field label="Versements des partis">{formatEuro(account.partyPayments, { round: true })}</Field>
          )}
          {account.partyContributions > 0 && (
            <Field label="Dépenses prises en charge par des partis">
              {formatEuro(account.partyContributions, { round: true })}
            </Field>
          )}
          {account.donations > 0 && <Field label="Dons">{formatEuro(account.donations, { round: true })}</Field>}
          {account.inKind > 0 && (
            <Field label="Autres concours en nature">{formatEuro(account.inKind, { round: true })}</Field>
          )}
          <Field label="Total" strong>
            {formatEuro(account.retained.revenue, { round: true })}
          </Field>
        </Fields>
      </div>

      <div className="space-y-2">
        <h3 className="font-heading font-semibold">Remboursement de l'État</h3>
        <Fields>
          <Field label="Maximum légal">{formatEuro(account.refundCap, { round: true })}</Field>
          {account.entitlement < account.refundCap && (
            <Field label="Limité à">{formatEuro(account.entitlement, { round: true })}</Field>
          )}
          {account.irregular > 0 && (
            <Field label="Dépenses irrégulières">− {formatEuro(account.irregular, { round: true })}</Field>
          )}
          {account.penalty > 0 && (
            <Field label="Réduction pour irrégularités">− {formatEuro(account.penalty, { round: true })}</Field>
          )}
          <Field label="Dû par l'État" strong>
            {formatEuro(account.refund, { round: true })}
          </Field>
        </Fields>
        <Note>
          {account.entitlement < account.refundCap &&
            "Le remboursement ne peut dépasser ni les dépenses payées par le mandataire, ni l'apport personnel du candidat. "}
          Dont {formatEuro(data.election.funding.advance, { round: true })} d'avance déjà versés.
          {deductions > 0 && ' Les montants retirés sont motivés dans la décision.'}
        </Note>
        <Note>
          <ExternalLink href={account.decision.url}>{account.decision.title}</ExternalLink>, publiée au Journal
          officiel le {formatDate(account.decision.publishedAt)} (NOR {account.decision.nor}).
        </Note>
      </div>

      <div className="space-y-2">
        <h3 className="font-heading font-semibold">Parrainages</h3>
        <p>
          <strong className="tabular-nums">{count(c.sponsorships.total)}</strong> parrainages validés, venus de{' '}
          {c.sponsorships.departments} départements ou collectivités.
        </p>
        <svg
          viewBox={`0 0 ${c.sponsorships.total} 1`}
          preserveAspectRatio="none"
          className="block h-3 w-full overflow-hidden rounded-full"
          aria-hidden
        >
          {offices.map((o, i) => (
            <rect
              key={o.id}
              x={starts[i]}
              y={0}
              width={c.sponsorships.byOffice[o.id]}
              height={1}
              className={o.fill}
            />
          ))}
        </svg>
        <ul className="space-y-0.5 text-xs">
          {offices.map((o) => (
            <li key={o.id} className="flex items-center gap-1.5">
              <span className={cn('size-2 shrink-0 rounded-full', o.bg)} />
              <span className="text-muted-foreground">{o.label}</span>
              <span className="ml-auto tabular-nums">{count(c.sponsorships.byOffice[o.id])}</span>
            </li>
          ))}
        </ul>
        <Note>
          Panneau n° {c.panel} · {count(c.firstRound.votes)} voix au premier tour
          {c.secondRound && `, ${count(c.secondRound.votes)} au second`}.
        </Note>
      </div>
    </div>
  )
}
