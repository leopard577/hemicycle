import { useEffect, useState } from 'react'
import { incomeLines, monthlyCost, sideIncome, sinceStart } from '@/lib/money'
import { formatDate, formatEuro } from '@/lib/format'
import type { Office } from '@/lib/offices'
import type { Parliamentarian, PayScales } from '@/types'
import { ExternalLink, KeyFigure } from './parts'

const PARTS = [
  { key: 'allowance', label: 'Indemnité', fill: 'fill-red-600', bg: 'bg-red-600' },
  { key: 'special', label: 'Indemnités spéciales', fill: 'fill-red-900', bg: 'bg-red-900' },
  { key: 'expenses', label: 'Frais de mandat', fill: 'fill-orange-500', bg: 'bg-orange-500' },
  { key: 'staff', label: 'Collaborateurs', fill: 'fill-amber-400', bg: 'bg-amber-400' },
] as const

/** What the seat costs, at the top of the panel: the figure that should strike first, then its breakdown */
export function CostSummary({
  member,
  payScales,
  office,
  onNoteRef,
}: {
  member: Parliamentarian
  payScales: PayScales
  office: Office
  /** Opens "Précisions et sources" on the given note */
  onNoteRef: (n: number) => void
}) {
  const cost = monthlyCost(member, payScales)
  const yearly = cost.total * 12
  const minimumWageYears = yearly / (payScales.minimumWage.gross * 12)
  const side = sideIncome(incomeLines(member), office)
  const latestYear = Math.max(0, ...side.lines.map((l) => l.latest?.year ?? 0))
  const mandates = member.localMandates.filter((m) => m.type !== 'intercommunal')
  const holdings = member.hatvp.interests?.holdings
  const capital = holdings?.reduce((sum, h) => sum + (h.value ?? 0), 0) ?? 0

  return (
    <div className="space-y-3 px-6 pt-5 pb-3">
      <div className="space-y-3 rounded-xl border border-red-600/30 bg-red-600/5 p-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-red-700 uppercase dark:text-red-400">
            Ce siège coûte aux contribuables
          </p>
          <p className="font-heading text-4xl leading-tight font-bold tabular-nums">
            {formatEuro(cost.total, { round: true })}
            <span className="text-base font-medium text-muted-foreground"> / mois</span>
            <NoteRef n={1} onClick={onNoteRef} />
          </p>
          <p className="text-sm text-muted-foreground">
            soit <strong className="text-foreground">{formatEuro(yearly, { round: true })} par an</strong>, l'équivalent
            de{' '}
            <strong className="text-foreground">
              {minimumWageYears.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} années
            </strong>{' '}
            de SMIC brut
            <NoteRef n={2} onClick={onNoteRef} />
          </p>
        </div>

        <Breakdown cost={cost} />

        <div className="border-t border-red-600/20 pt-3">
          <p className="text-xs text-muted-foreground">Depuis son entrée en fonction, le {formatDate(member.startDate)}</p>
          <div className="flex items-start">
            <LiveCounter monthly={cost.total} startDate={member.startDate} />
            <NoteRef n={3} onClick={onNoteRef} />
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <KeyFigure
          label="En plus du mandat"
          value={
            !member.hatvp.interests ? '—' : side.total > 0 ? `+${formatEuro(side.total, { compact: true })}` : '0 €'
          }
          hint={
            !member.hatvp.interests
              ? 'Déclaration indisponible'
              : side.total > 0
                ? `par an (${latestYear})`
                : 'Aucun autre revenu'
          }
          highlight={side.total > 0}
        />
        <KeyFigure
          label="Mandats locaux"
          value={mandates.length}
          hint={mandates.length ? 'en cours' : 'Aucun en cours'}
          highlight={mandates.length > 0}
        />
        <KeyFigure
          label="Capital déclaré"
          value={
            holdings === undefined || holdings === null
              ? '—'
              : holdings.length === 0
                ? 'Aucun'
                : formatEuro(capital, { compact: true })
          }
          hint={
            holdings === undefined
              ? 'Déclaration indisponible'
              : holdings === null
                ? 'Partie non remplie'
                : holdings.length === 0
                  ? 'Aucune part de société'
                  : `parts dans ${holdings.length} société${holdings.length > 1 ? 's' : ''}`
          }
        />
      </dl>
    </div>
  )
}

function Breakdown({ cost }: { cost: Record<(typeof PARTS)[number]['key'] | 'total', number> }) {
  const parts = PARTS.filter((p) => cost[p.key] > 0)
  // Cumulative positions of the bar segments
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((sum, p) => sum + cost[p.key], 0))
  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${cost.total} 1`}
        preserveAspectRatio="none"
        className="block h-3 w-full overflow-hidden rounded-full"
        aria-hidden
      >
        {parts.map((p, i) => (
          <rect key={p.key} x={starts[i]} y={0} width={cost[p.key]} height={1} className={p.fill} />
        ))}
      </svg>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span className={`size-2 shrink-0 rounded-full ${p.bg}`} />
            <span className="truncate text-muted-foreground">{p.label}</span>
            <span className="ml-auto font-medium tabular-nums">{formatEuro(cost[p.key], { round: true })}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const stars = (n: number) => '*'.repeat(n)

/** Asterisk pointing to the matching calculation note */
function NoteRef({ n, onClick }: { n: number; onClick: (n: number) => void }) {
  return (
    <a
      href={`#note-${n}`}
      onClick={(e) => {
        e.preventDefault()
        onClick(n)
      }}
      aria-label={`Note ${n} : détail du calcul`}
      className="-mx-1 -my-2 ml-0 px-1.5 py-2 align-super text-sm font-semibold text-red-700 no-underline dark:text-red-400"
    >
      {stars(n)}
    </a>
  )
}

/** Calculation notes, in "Précisions et sources": every figure of the summary is rebuilt from the pay scales */
export function CostNotes({ member, payScales, office }: { member: Parliamentarian; payScales: PayScales; office: Office }) {
  const feminine = member.honorific === 'Mme'
  const { allowance, minimumWage } = payScales
  const cost = monthlyCost(member, payScales)
  const yearlyMinimumWage = minimumWage.gross * 12
  const euro = (n: number) => formatEuro(n)
  const updated = (iso: string) => iso.split('-').reverse().join('/')

  return (
    <ol className="space-y-2 text-xs text-muted-foreground">
      <li id="note-1" className="flex gap-1.5">
        <span className="shrink-0 font-semibold text-red-700 dark:text-red-400">{stars(1)}</span>
        <div className="space-y-1">
          <p>
            Somme des montants mensuels que {office.institution} consacre à chaque siège :{' '}
            <strong className="text-foreground">indemnité parlementaire brute</strong> {euro(allowance.gross)} (base{' '}
            {euro(allowance.base)} + résidence {euro(allowance.residence)} + fonction {euro(allowance.office)})
            {member.specialAllowances.map((s) => (
              <span key={s.label + s.body}>
                {' '}
                + <strong className="text-foreground">{s.label.toLowerCase()}</strong> {euro(s.amount)}
              </span>
            ))}{' '}
            + <strong className="text-foreground">avance de frais de mandat</strong> {euro(payScales.expenseAllowance)}{' '}
            + <strong className="text-foreground">crédit collaborateurs</strong> {euro(payScales.staffBudget)} ={' '}
            <strong className="text-foreground">{euro(cost.total)}</strong>.
          </p>
          <p>
            {office.envelopeNote(feminine)} L'indemnité est comptée en brut : {office.the(feminine)} touche{' '}
            {euro(allowance.net)} net par mois, avant impôt.
          </p>
          <p>
            Ne sont pas comptés : les cotisations à la charge {office.ofInstitution}, les facilités de transport et les
            autres avantages que {office.institution} ne chiffre pas.
          </p>
          <p>
            Barèmes :{' '}
            {payScales.sources.map((source, i) => (
              <span key={source.url}>
                {i > 0 && ', '}
                <ExternalLink href={source.url}>{source.label}</ExternalLink>
              </span>
            ))}
            , mise à jour {updated(payScales.updatedAt)}.
          </p>
        </div>
      </li>
      <li id="note-2" className="flex gap-1.5">
        <span className="shrink-0 font-semibold text-red-700 dark:text-red-400">{stars(2)}</span>
        <p>
          {euro(cost.total)} × 12 mois = {euro(cost.total * 12)} par an. SMIC brut à temps plein : {euro(minimumWage.gross)}{' '}
          par mois au {updated(minimumWage.updatedAt)}, soit {euro(yearlyMinimumWage)} par an. {euro(cost.total * 12)} ÷{' '}
          {euro(yearlyMinimumWage)} ={' '}
          {((cost.total * 12) / yearlyMinimumWage).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} années de SMIC (
          <ExternalLink href={minimumWage.source}>service-public.gouv.fr</ExternalLink>).
        </p>
      </li>
      <li id="note-3" className="flex gap-1.5">
        <span className="shrink-0 font-semibold text-red-700 dark:text-red-400">{stars(3)}</span>
        <p>
          {euro(cost.total)} par mois × nombre de mois écoulés depuis le {formatDate(member.startDate)} (mois moyen de
          30,44 jours), recalculé en direct. Montant théorique : il suppose toutes les enveloppes consommées chaque mois,
          au barème actuel.
        </p>
      </li>
    </ol>
  )
}

/** Live counter: public money committed second by second */
function LiveCounter({ monthly, startDate }: { monthly: number; startDate: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setInterval(() => setNow(Date.now()), reduced ? 1000 : 100)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p className="font-heading text-2xl font-bold text-red-700 tabular-nums dark:text-red-400">
      {sinceStart(monthly, startDate, now).toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </p>
  )
}
