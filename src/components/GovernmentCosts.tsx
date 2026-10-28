import type { ReactNode } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { ExternalLink, Note } from '@/components/panel/parts'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatDate, formatEuro } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CabinetsSummary, ElyseeBudget, GovernmentMember, MinistryBudget, MinistryBudgets } from '@/types'

const count = (n: number) => n.toLocaleString('fr-FR')

const ELYSEE_FILLS: Record<string, { fill: string; bg: string }> = {
  staff: { fill: 'fill-blue-700', bg: 'bg-blue-700' },
  trips: { fill: 'fill-red-600', bg: 'bg-red-600' },
  palace: { fill: 'fill-orange-500', bg: 'bg-orange-500' },
  operations: { fill: 'fill-amber-400', bg: 'bg-amber-400' },
  investment: { fill: 'fill-teal-500', bg: 'bg-teal-500' },
  shop: { fill: 'fill-zinc-400', bg: 'bg-zinc-400' },
}

/**
 * Horizontal stacked bar: one segment per part, widths proportional to the amounts. Drawn in fractions of the
 * total: SVG coordinates are 32-bit floats, and amounts in the hundreds of millions would be rendered off.
 */
function StackedBar({ parts }: { parts: { key: string; amount: number; fill: string }[] }) {
  const total = parts.reduce((s, p) => s + p.amount, 0)
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((s, p) => s + p.amount, 0) / total)
  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="block h-3 w-full overflow-hidden rounded-full"
      aria-hidden
    >
      {parts.map((p, i) => (
        <rect key={p.key} x={starts[i]} y={0} width={p.amount / total} height={1} className={p.fill} />
      ))}
    </svg>
  )
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/60 px-3 py-2">
      <dt className="text-xs leading-tight text-muted-foreground">{label}</dt>
      <dd className="font-heading text-xl font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/** Ministerial cabinets: headcount by function, then every cabinet ranked by headcount */
export function CabinetsCard({
  cabinets,
  members,
  selectedId,
  onSelect,
}: {
  cabinets: CabinetsSummary
  members: GovernmentMember[]
  selectedId: string | null
  onSelect: (m: GovernmentMember) => void
}) {
  const { totals } = cabinets
  const size = (m: GovernmentMember) => m.cabinet!.members + m.cabinet!.support
  const ranked = members.filter((m) => m.cabinet).sort((a, b) => size(b) - size(a))
  const max = size(ranked[0])
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">Les cabinets ministériels</h3>
        <p className="text-sm text-muted-foreground">Au {formatDate(cabinets.asOf)}</p>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <Tile label="Membres des cabinets">{count(totals.members)}</Tile>
        <Tile label="Personnels de soutien">{count(totals.support)}</Tile>
        <Tile label="Indemnités de sujétion">
          {formatEuro(totals.isp, { compact: true })}
          <span className="text-xs font-normal text-muted-foreground"> /an</span>
        </Tile>
      </dl>

      <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {cabinets.byFunction.map((f) => (
          <li key={f.label} className="flex items-baseline gap-2">
            <span className={cn('truncate', f.group === 'support' && 'text-muted-foreground')}>{f.label}</span>
            <span className="ml-auto tabular-nums">{count(f.count)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        {count(cabinets.contractMembers)} des {count(totals.members)} membres sont recrutés sur contrat ; les autres
        sont des fonctionnaires affectés, mis à disposition ou détachés.
      </p>

      <div className="space-y-1">
        <h4 className="text-sm font-medium">Taille de chaque cabinet</h4>
        <ul className="space-y-0.5">
          {ranked.map((m) => {
            const c = m.cabinet!
            return (
              <li key={m.id}>
                <Button
                  variant="ghost"
                  onClick={() => onSelect(m)}
                  aria-pressed={m.id === selectedId}
                  aria-label={`${m.firstName} ${m.lastName} : ${c.members} membres, ${c.support} personnels de soutien`}
                  className={cn(
                    'grid h-auto w-full grid-cols-[9rem_1fr_3rem] items-center gap-2 px-2 py-1 text-left font-normal sm:grid-cols-[12rem_1fr_3.5rem]',
                    m.id === selectedId && 'bg-accent ring-1 ring-foreground',
                  )}
                >
                  <span className="truncate text-sm">
                    {m.firstName} {m.lastName}
                  </span>
                  {/* A `size-` class opts out of Button's default 16px icon size */}
                  <svg
                    viewBox={`0 0 ${max} 1`}
                    preserveAspectRatio="none"
                    className="block size-full h-2.5"
                    aria-hidden
                  >
                    <rect x={0} y={0} width={c.members} height={1} className="fill-red-600" />
                    <rect x={c.members} y={0} width={c.support} height={1} className="fill-muted-foreground/40" />
                  </svg>
                  <span className="text-right text-sm tabular-nums">{count(size(m))}</span>
                </Button>
              </li>
            )
          })}
        </ul>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-600" />
            Membres du cabinet
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
            Personnels de soutien
          </li>
        </ul>
      </div>

      <Note>
        Effectifs physiques déclarés par chaque cabinet. L'annexe de cette année ne publie pas la masse salariale des
        cabinets, seulement l'enveloppe annuelle de l'indemnité pour sujétions particulières (ISP), qui n'en est
        qu'une partie. Un collaborateur partagé entre deux cabinets n'est compté qu'une fois. Les totaux comprennent
        le cabinet du ministre délégué chargé de la ruralité, parti le 22 septembre 2026. Source :{' '}
        <ExternalLink href={cabinets.source.url}>{cabinets.source.label}</ExternalLink>.
      </Note>
    </div>
  )
}

/** Budget of the Présidence de la République: allocation, spending by item, staff */
export function ElyseeCard({ elysee }: { elysee: ElyseeBudget }) {
  const allocation = elysee.allocation[String(elysee.year)]
  const next = elysee.allocation[String(elysee.year + 1)]
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">Le budget de l'Élysée</h3>
        <p className="text-sm text-muted-foreground">Présidence de la République, {elysee.year}</p>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <Tile label="Dotation de l'État">{formatEuro(allocation, { compact: true })}</Tile>
        <Tile label="Dépenses prévues">{formatEuro(elysee.spendingTotal, { compact: true })}</Tile>
        <Tile label="Agents (ETP)">{count(elysee.staff.count)}</Tile>
      </dl>

      <div className="space-y-2">
        <StackedBar
          parts={elysee.spending.map((s) => ({ key: s.id, amount: s.amount, fill: ELYSEE_FILLS[s.id].fill }))}
        />
        <ul className="space-y-1 text-sm">
          {elysee.spending.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <span className={cn('size-2.5 shrink-0 rounded-full', ELYSEE_FILLS[s.id].bg)} />
              <span className="truncate">{s.label}</span>
              <span className="ml-auto tabular-nums">{formatEuro(s.amount, { round: true })}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-muted-foreground">
        La dotation, {formatEuro(allocation, { round: true })}, n'a pas changé depuis {elysee.allocationSince}
        {next === allocation && ` et le projet de loi de finances la reconduit pour ${elysee.year + 1}`}. Le reste est
        couvert par {formatEuro(elysee.ownRevenue, { compact: true })} de recettes propres (refacturation de voyages
        et d'événements, restaurant, boutique…). Les {elysee.internationalTrips.count} déplacements à l'étranger
        prévus en {elysee.year} coûteraient {formatEuro(elysee.internationalTrips.cost, { compact: true })}.{' '}
        {count(elysee.staff.count)} agents en équivalent temps plein au {formatDate(elysee.staff.asOf)}, pour un
        plafond de {count(elysee.staff.ceiling)}.
      </p>

      <Note>
        Prévision d'exécution établie par la Présidence en juin {elysee.year}. Source :{' '}
        <ExternalLink href={elysee.source.url}>{elysee.source.label}</ExternalLink>.
      </Note>
    </div>
  )
}

/** Budget of each ministry in the finance bill: payment credits, largest first, each with its programmes */
export function MinistriesCard({
  budgets,
  members,
  onSelect,
}: {
  budgets: MinistryBudgets
  members: GovernmentMember[]
  onSelect: (m: GovernmentMember) => void
}) {
  const total = budgets.items.reduce((s, m) => s + m.cp, 0)
  const evaluative = budgets.items.reduce((s, m) => s + m.evaluative, 0)
  const max = budgets.items[0].cp
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">Le budget de chaque ministère</h3>
        <p className="text-sm text-muted-foreground">
          Crédits de paiement proposés pour {budgets.year}, budget général de l'État
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <Tile label="Total des ministères">{formatEuro(total, { compact: true })}</Tile>
        <Tile label="Dont crédits évaluatifs">{formatEuro(evaluative, { compact: true })}</Tile>
      </dl>

      <ul className="divide-y">
        {budgets.items.map((b) => (
          <MinistryRow
            key={b.label}
            budget={b}
            max={max}
            minister={members.find((m) => m.id === b.ministerId)}
            onSelect={onSelect}
          />
        ))}
      </ul>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-sky-600" />
          Crédits pilotés par le ministère
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-sky-600/35" />
          Crédits évaluatifs (charge de la dette, remboursements d'impôts…)
        </li>
      </ul>

      <Note>
        Montants du projet de loi de finances tel que déposé, avant le vote du Parlement, regroupés par ministère par
        le Gouvernement. Les crédits évaluatifs dépendent de la loi et de la conjoncture (taux d'intérêt, impôts
        remboursés), pas d'un choix du ministre. Le budget de l'Élysée et ceux des assemblées figurent dans « Action
        et comptes publics » ; le ministre des petites et moyennes entreprises n'a pas de ligne propre, ses crédits
        relèvent de l'Économie. Source : <ExternalLink href={budgets.source.url}>{budgets.source.label}</ExternalLink>.
      </Note>
    </div>
  )
}

function MinistryRow({
  budget: b,
  max,
  minister,
  onSelect,
}: {
  budget: MinistryBudget
  max: number
  minister: GovernmentMember | undefined
  onSelect: (m: GovernmentMember) => void
}) {
  const steered = b.cp - b.evaluative
  return (
    <li>
      <Collapsible>
        <CollapsibleTrigger className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 py-2 text-left hover:bg-accent/50">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium" title={b.label}>
              {b.label}
            </span>
            {minister && (
              <span className="block truncate text-xs text-muted-foreground">
                {minister.firstName} {minister.lastName}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
            {formatEuro(b.cp, { compact: true })}
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </span>
          {/* Fractions of the largest budget: amounts in the billions exceed SVG's 32-bit float precision */}
          <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="col-span-2 block h-2 w-full" aria-hidden>
            <rect x={0} y={0} width={steered / max} height={1} className="fill-sky-600" />
            <rect x={steered / max} y={0} width={b.evaluative / max} height={1} className="fill-sky-600/35" />
          </svg>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pb-3">
          <ul className="space-y-0.5 text-xs">
            {b.programmes.map((p) => (
              <li key={p.label} className="flex items-baseline gap-2">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="ml-auto shrink-0 tabular-nums">{formatEuro(p.cp, { compact: true })}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Autorisations d'engagement : {formatEuro(b.ae, { compact: true })}.
            {b.evaluative > 0 && ` Dont ${formatEuro(b.evaluative, { compact: true })} de crédits évaluatifs.`}
          </p>
          {minister && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onSelect(minister)}>
              Voir la fiche de {minister.firstName} {minister.lastName}
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}
