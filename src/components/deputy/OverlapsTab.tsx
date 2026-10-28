import { Badge } from '@/components/ui/badge'
import {
  CATEGORIES,
  CATEGORY_ORDER,
  displayedRole,
  type IncomeLine,
  incomeByYear,
  incomeLines,
  isExecutive,
  isMandateDeclared,
  sideIncome,
  type YearIncome,
} from '@/lib/money'
import { formatDate, formatEuro } from '@/lib/format'
import type { Deputy, Income, LocalMandate, PayScales } from '@/types'
import { MissingData, Note, Section } from './parts'

export function OverlapsTab({ deputy, payScales }: { deputy: Deputy; payScales: PayScales }) {
  const lines = incomeLines(deputy)
  const years = incomeByYear(lines)
  const side = sideIncome(lines)
  const pastOffices = lines.filter((l) => (l.category === 'european' || l.category === 'senate') && !l.ongoing)
  const { interests, otherMandates } = deputy.hatvp

  return (
    <div className="divide-y">
      <Section title="Revenus déclarés, année par année">
        {!interests ? (
          <MissingData title="Déclaration d'intérêts non disponible">
            Sans contenu publié, impossible de reconstituer ses revenus déclarés.
          </MissingData>
        ) : years.length ? (
          <IncomeChart years={years} yearlyMinimumWage={payScales.minimumWage.gross * 12} />
        ) : (
          <Note>Aucun montant déclaré.</Note>
        )}
      </Section>

      <Section
        title="En parallèle du mandat"
        aside={
          side.total > 0 && (
            <Badge className="bg-orange-600 text-white tabular-nums">+{formatEuro(side.total, { round: true })} / an</Badge>
          )
        }
      >
        {!interests ? (
          <Note>Déclaration d'intérêts non disponible.</Note>
        ) : side.lines.length ? (
          <ul className="divide-y rounded-lg border">
            {side.lines.map((l, i) => (
              <SideIncomeRow key={i} line={l} />
            ))}
          </ul>
        ) : (
          <Note>Aucune activité ni aucun mandat déclarés en parallèle du mandat de député.</Note>
        )}
      </Section>

      <Section title="Mandats locaux en cours" aside={<Badge variant="outline">Répertoire national des élus</Badge>}>
        {deputy.localMandates.length ? (
          <>
            <ul className="divide-y rounded-lg border">
              {deputy.localMandates.map((m, i) => (
                <RneMandate key={i} mandate={m} declared={interests?.mandates ?? null} />
              ))}
            </ul>
            <LocalAllowanceCap declared={side.local} monthlyCap={payScales.localAllowanceCap} />
          </>
        ) : (
          <Note>Aucun mandat local en cours au Répertoire national des élus.</Note>
        )}
      </Section>

      {(pastOffices.length > 0 || otherMandates.length > 0) && (
        <Section title="Autres mandats et fonctions">
          <ul className="space-y-3">
            {pastOffices.map((l, i) => {
              const total = l.income.amounts.reduce((sum, m) => sum + (m.amount ?? 0), 0)
              return (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={`size-2 shrink-0 rounded-full ${CATEGORIES[l.category].bg}`} />
                      {l.income.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[l.income.start, l.income.end].filter(Boolean).join(' – ')}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">{formatEuro(total, { round: true })}</div>
                    <div className="text-xs text-muted-foreground">déclarés au total</div>
                  </div>
                </li>
              )
            })}
            {otherMandates.map((o) => (
              <li key={`${o.type}${o.role}`} className="space-y-0.5">
                <div className="font-medium">{o.role ?? o.institution}</div>
                <div className="text-xs text-muted-foreground">
                  {o.lastFiledAt
                    ? `Déclaration déposée à la HATVP pour cette fonction, la dernière le ${formatDate(o.lastFiledAt)}`
                    : 'Déclaration déposée à la HATVP pour cette fonction, en cours de traitement'}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

/** Notes for the tab, shown in "Précisions et sources" at the bottom of the panel */
export function OverlapsNotes({ deputy, payScales }: { deputy: Deputy; payScales: PayScales }) {
  const rneUpdatedAt = deputy.localMandates[0]?.updatedAt
  return (
    <>
      <Note>
        Revenus : montants que le député a lui-même déclarés à la HATVP, bruts ou nets selon les déclarations, pour les
        cinq années précédant sa déclaration. Ils ne sont pas vérifiés par l'application.
      </Note>
      <Note>
        « En parallèle du mandat » : activités sans date de fin, ou terminées après son entrée en fonction, avec le
        dernier montant annuel déclaré. « Déclaré à 0 € » signifie que la fonction est déclarée sans rémunération.
      </Note>
      <Note>
        Mandats locaux : Répertoire national des élus du ministère de l'Intérieur
        {rneUpdatedAt && `, mis à jour le ${formatDate(rneUpdatedAt)}`}. Les élus y sont retrouvés grâce à leur date de
        naissance et à leur nom. Un mandat terminé depuis peut encore y figurer.
      </Note>
      <Note>
        Les indemnités de mandats locaux s'ajoutent à l'indemnité parlementaire dans la limite de{' '}
        {formatEuro(payScales.localAllowanceCap)} par mois ; au-delà, elles sont écrêtées. Les fonctions exécutives locales
        (maire, adjoint, président ou vice-président d'une collectivité ou d'une intercommunalité) sont incompatibles
        avec le mandat de député depuis 2017.
      </Note>
    </>
  )
}

const WIDTH = 320
const HEIGHT = 170
const MARGIN = { top: 18, bottom: 22, left: 4, right: 4 }

/** Bars stacked by category, with the yearly SMIC as a reference line */
function IncomeChart({ years, yearlyMinimumWage }: { years: YearIncome[]; yearlyMinimumWage: number }) {
  const max = Math.max(yearlyMinimumWage, ...years.map((y) => y.total)) * 1.08
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const y = (v: number) => MARGIN.top + plotHeight - (v / max) * plotHeight
  const step = (WIDTH - MARGIN.left - MARGIN.right) / years.length
  const barWidth = Math.min(34, step * 0.68)
  const present = CATEGORY_ORDER.filter((c) => years.some((yr) => yr.parts[c]))
  const peak = years.reduce((a, b) => (b.total > a.total ? b : a))

  return (
    <figure className="space-y-2">
      <p className="text-sm">
        Jusqu'à <strong className="tabular-nums">{formatEuro(peak.total, { round: true })}</strong> déclarés en{' '}
        {peak.year}, soit{' '}
        <strong>{(peak.total / yearlyMinimumWage).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} fois</strong> le
        SMIC brut annuel.
      </p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Revenus déclarés par année : ${years.map((yr) => `${yr.year}, ${formatEuro(yr.total, { round: true })}`).join(' ; ')}`}
      >
        {years.map((yr, i) => {
          const x = MARGIN.left + i * step + (step - barWidth) / 2
          let stacked = 0
          return (
            <g key={yr.year}>
              {present.map((c) => {
                const v = yr.parts[c]
                if (!v) return null
                const top = y(stacked + v)
                const h = y(stacked) - top
                stacked += v
                return (
                  <rect key={c} x={x} y={top} width={barWidth} height={h} className={CATEGORIES[c].fill}>
                    <title>{`${yr.year} · ${CATEGORIES[c].label} : ${formatEuro(v, { round: true })}`}</title>
                  </rect>
                )
              })}
              <text
                x={x + barWidth / 2}
                y={y(yr.total) - 4}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold tabular-nums"
              >
                {formatEuro(yr.total, { compact: true })}
              </text>
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 5}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {yr.year}
              </text>
            </g>
          )
        })}
        <line
          x1={0}
          x2={WIDTH}
          y1={y(yearlyMinimumWage)}
          y2={y(yearlyMinimumWage)}
          strokeDasharray="3 2"
          className="stroke-foreground/60"
          strokeWidth={0.8}
        />
      </svg>
      <figcaption>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {present.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${CATEGORIES[c].bg}`} />
              {CATEGORIES[c].label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="w-3 border-t border-dashed border-foreground/60" />
            SMIC brut annuel
          </li>
        </ul>
      </figcaption>
    </figure>
  )
}

function SideIncomeRow({ line }: { line: IncomeLine }) {
  const { income, category, latest, duplicate } = line
  const redacted = income.amounts.some((m) => m.amount === null)
  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className={`size-2 shrink-0 rounded-full ${CATEGORIES[category].bg}`} />
          <span className="truncate">{income.title ?? 'Intitulé non publié'}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {[CATEGORIES[category].label, income.organization, income.start && `depuis ${income.start}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {duplicate ? (
          <span className="text-xs text-muted-foreground">Même revenu que plus haut, compté une fois</span>
        ) : latest && latest.amount > 0 ? (
          <>
            <div className="font-semibold text-orange-700 tabular-nums dark:text-orange-400">
              +{formatEuro(latest.amount, { round: true })}
            </div>
            <div className="text-xs text-muted-foreground">
              en {latest.year}
              {income.grossNet && `, ${income.grossNet.toLowerCase()}`}
            </div>
          </>
        ) : redacted ? (
          <Badge variant="destructive">Montant non publié</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Déclaré à 0 €</span>
        )}
      </div>
    </li>
  )
}

function RneMandate({ mandate, declared }: { mandate: LocalMandate; declared: Income[] | null }) {
  const executive = isExecutive(mandate)
  const isDeclared = declared ? isMandateDeclared(mandate, declared) : null
  const role = displayedRole(mandate)
  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <div className="text-sm font-medium">{role ?? mandate.label}</div>
        <div className="text-xs text-muted-foreground">
          {[role && mandate.label, mandate.place, mandate.start && `depuis le ${formatDate(mandate.start)}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {executive && <Badge variant="destructive">Interdit avec le mandat de député</Badge>}
        {isDeclared === true && <Badge variant="secondary">Déclaré à la HATVP</Badge>}
        {isDeclared === false && (
          <Badge variant="outline" className="border-orange-500/60 text-orange-700 dark:text-orange-400">
            Absent de sa déclaration
          </Badge>
        )}
      </div>
    </li>
  )
}

/** Declared local allowances against the cap above which they are cut */
function LocalAllowanceCap({ declared, monthlyCap }: { declared: number; monthlyCap: number }) {
  const cap = monthlyCap * 12
  const share = Math.min(1, declared / cap)
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/60 p-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>Indemnités locales déclarées</span>
        <span className="font-semibold tabular-nums">
          {formatEuro(declared, { round: true })}
          <span className="font-normal text-muted-foreground"> / {formatEuro(cap, { round: true })} max.</span>
        </span>
      </div>
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="block h-2 w-full overflow-hidden rounded-full" aria-hidden>
        <rect width={1} height={1} className="fill-muted-foreground/20" />
        <rect width={share} height={1} className="fill-amber-500" />
      </svg>
      <Note>
        Un député peut toucher jusqu'à {formatEuro(cap, { round: true })} par an d'indemnités locales en plus de son
        indemnité parlementaire.
      </Note>
    </div>
  )
}
