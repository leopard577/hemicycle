// Hemicycle readings: every seat is coloured according to an indicator taken from `summary`
import { percent } from '@/lib/activity'
import { CONVICTION_TIERS, type ConvictionTier } from '@/lib/convictions'
import type { Summary } from '@/lib/money'
import type { Office } from '@/lib/offices'
import { formatEuro } from '@/lib/format'

export type Reading =
  | 'group'
  | 'overlaps'
  | 'sideIncome'
  | 'capital'
  | 'alerts'
  | 'convictions'
  | 'votes'
  | 'attendance'
  | 'bills'

/** Readings that need `Parliamentarian.activity`: left out where a page has none */
export const ACTIVITY_READINGS: Reading[] = ['votes', 'attendance', 'bills']

interface Tier {
  label: string
  fill: string
  bg: string
  test: (s: Summary) => boolean
}

interface ReadingDefinition {
  label: string
  tiers: Tier[]
  /** Ranking value; 0 = left out of the ranking */
  value: (s: Summary) => number
  /** Lists everyone concerned instead of a top 10 */
  listAll?: boolean
  /** Limits of the indicator, shown under the overview */
  note?: string
  detail: (s: Summary) => string | null
  overview: (count: number, summaries: Summary[], office: Office) => string
}

const NONE = { fill: 'fill-muted-foreground/25', bg: 'bg-muted-foreground/25' }

// Activity scale: one hue per tier so the seats read at a glance, without the reds and oranges that mark a point of attention
const HIGHEST = { fill: 'fill-fuchsia-600 dark:fill-fuchsia-400', bg: 'bg-fuchsia-600 dark:bg-fuchsia-400' }
const HIGH = { fill: 'fill-violet-700 dark:fill-violet-400', bg: 'bg-violet-700 dark:bg-violet-400' }
const MEDIUM = { fill: 'fill-blue-500', bg: 'bg-blue-500' }
const LOW = { fill: 'fill-cyan-400', bg: 'bg-cyan-400' }
const LOWER = { fill: 'fill-green-400', bg: 'bg-green-400' }
const LOWEST = { fill: 'fill-lime-300', bg: 'bg-lime-300' }

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

// Tiers from highest to lowest: the first one that matches gives the colour
export const READINGS: Record<Exclude<Reading, 'group'>, ReadingDefinition> = {
  overlaps: {
    label: 'Cumul de mandats',
    tiers: [
      { label: '3 et plus', fill: 'fill-red-600', bg: 'bg-red-600', test: (s) => s.overlaps >= 3 },
      { label: '2', fill: 'fill-orange-500', bg: 'bg-orange-500', test: (s) => s.overlaps === 2 },
      { label: '1', fill: 'fill-amber-300', bg: 'bg-amber-300', test: (s) => s.overlaps === 1 },
      { label: 'Aucun', ...NONE, test: () => true },
    ],
    value: (s) => s.overlaps,
    detail: (s) =>
      s.overlaps
        ? `${s.overlaps} mandat${s.overlaps > 1 ? 's' : ''} ou activité${s.overlaps > 1 ? 's' : ''} en plus`
        : null,
    overview: (n, _, o) => `${n} ${o.plural} exercent au moins un autre mandat ou une activité rémunérée en même temps.`,
  },
  sideIncome: {
    label: 'Autres revenus',
    tiers: [
      { label: '60 k€ et plus', fill: 'fill-red-800', bg: 'bg-red-800', test: (s) => s.sideIncome >= 60_000 },
      { label: '30 à 60 k€', fill: 'fill-red-600', bg: 'bg-red-600', test: (s) => s.sideIncome >= 30_000 },
      { label: '10 à 30 k€', fill: 'fill-orange-500', bg: 'bg-orange-500', test: (s) => s.sideIncome >= 10_000 },
      { label: 'Moins de 10 k€', fill: 'fill-amber-300', bg: 'bg-amber-300', test: (s) => s.sideIncome > 0 },
      { label: 'Aucun', ...NONE, test: () => true },
    ],
    value: (s) => s.sideIncome,
    detail: (s) => (s.sideIncome > 0 ? `+${formatEuro(s.sideIncome, { round: true })} par an` : null),
    overview: (n, summaries, o) =>
      `${n} ${o.plural} déclarent des revenus en plus de leur indemnité : ${formatEuro(
        summaries.reduce((sum, s) => sum + s.sideIncome, 0),
        { compact: true },
      )} par an au total.`,
  },
  capital: {
    label: 'Capital déclaré',
    tiers: [
      { label: '1 M€ et plus', fill: 'fill-red-800', bg: 'bg-red-800', test: (s) => s.capital >= 1_000_000 },
      { label: '100 k€ à 1 M€', fill: 'fill-red-600', bg: 'bg-red-600', test: (s) => s.capital >= 100_000 },
      { label: '10 à 100 k€', fill: 'fill-orange-500', bg: 'bg-orange-500', test: (s) => s.capital >= 10_000 },
      { label: 'Moins de 10 k€', fill: 'fill-amber-300', bg: 'bg-amber-300', test: (s) => s.capital > 0 },
      { label: 'Aucun', ...NONE, test: () => true },
    ],
    value: (s) => s.capital,
    detail: (s) => (s.capital > 0 ? formatEuro(s.capital, { compact: true }) : null),
    overview: (n, summaries, o) =>
      `${n} ${o.plural} déclarent des parts dans des sociétés, pour une valeur totale de ${formatEuro(
        summaries.reduce((sum, s) => sum + s.capital, 0),
        { compact: true },
      )}. Le patrimoine immobilier et l'épargne n'y figurent pas.`,
  },
  alerts: {
    label: 'Déclarations',
    tiers: [
      {
        label: 'Fonction incompatible ou déclaration non retrouvée',
        fill: 'fill-red-600',
        bg: 'bg-red-600',
        test: (s) => s.serious > 0,
      },
      {
        label: 'Déclaration tardive ou mandat non retrouvé',
        fill: 'fill-orange-500',
        bg: 'bg-orange-500',
        test: (s) => s.warnings > 0,
      },
      { label: 'Rien à signaler', ...NONE, test: () => true },
    ],
    value: (s) => s.serious * 10 + s.warnings,
    detail: (s) => {
      const n = s.serious + s.warnings
      return n ? `${n} signalement${n > 1 ? 's' : ''}` : null
    },
    overview: (n, _, o) =>
      `${n} ${o.plural} ont au moins un point signalé dans leurs déclarations, en comparant les registres ${o.ofInstitution}, de la HATVP et du Répertoire national des élus.`,
  },
  convictions: {
    label: 'Condamnations',
    listAll: true,
    tiers: (Object.entries(CONVICTION_TIERS) as [ConvictionTier, (typeof CONVICTION_TIERS)[ConvictionTier]][]).map(
      ([tier, { label, fill, dot }]) => ({ label, fill, bg: dot, test: (s: Summary) => s.convictionTier === tier }),
    ),
    value: (s) => ({ final: 3, pending: 2, other: 1, none: 0 })[s.convictionTier],
    detail: (s) => (s.convictions ? `${s.convictions} décision${s.convictions > 1 ? 's' : ''}` : null),
    overview: (n, _, o) => `Casier Politique recense au moins une décision de justice pour ${n} ${o.plural}.`,
  },
  votes: {
    label: 'Votes',
    tiers: [
      { label: '5 000 et plus', ...HIGHEST, test: (s) => s.votes >= 5000 },
      { label: '4 000 à 5 000', ...HIGH, test: (s) => s.votes >= 4000 },
      { label: '3 000 à 4 000', ...MEDIUM, test: (s) => s.votes >= 3000 },
      { label: '2 000 à 3 000', ...LOW, test: (s) => s.votes >= 2000 },
      { label: '1 000 à 2 000', ...LOWER, test: (s) => s.votes >= 1000 },
      { label: 'Moins de 1 000', ...LOWEST, test: () => true },
    ],
    value: (s) => s.votes,
    detail: (s) => `${s.votes.toLocaleString('fr-FR')} vote${s.votes > 1 ? 's' : ''}`,
    overview: (_, summaries, o) =>
      `Un ${o.noun} a voté ${median(summaries.map((s) => s.votes)).toLocaleString('fr-FR')} fois depuis le début de son mandat (médiane).`,
    note: "Scrutins publics en séance, délégations comprises. Beaucoup portent sur des amendements examinés avec peu de présents, donc ce nombre ne mesure pas la présence à l'Assemblée, et un mandat commencé plus tard en compte moins.",
  },
  attendance: {
    label: 'Présence en commission',
    tiers: [
      { label: '60 % et plus', ...HIGHEST, test: (s) => (s.attendance ?? 0) >= 0.6 },
      { label: '50 à 60 %', ...HIGH, test: (s) => (s.attendance ?? 0) >= 0.5 },
      { label: '40 à 50 %', ...MEDIUM, test: (s) => (s.attendance ?? 0) >= 0.4 },
      { label: '30 à 40 %', ...LOW, test: (s) => (s.attendance ?? 0) >= 0.3 },
      { label: '20 à 30 %', ...LOWER, test: (s) => (s.attendance ?? 0) >= 0.2 },
      { label: 'Moins de 20 %', ...LOWEST, test: (s) => s.attendance !== null },
      { label: 'Moins de 10 réunions', ...NONE, test: () => true },
    ],
    value: (s) => Math.round((s.attendance ?? 0) * 100),
    detail: (s) => (s.attendance === null ? null : percent(s.attendance)),
    overview: (_, summaries, o) =>
      `Un ${o.noun} assiste à ${percent(median(summaries.flatMap((s) => s.attendance ?? [])))} des réunions de ses commissions (médiane).`,
    note: "Présences relevées par l'Assemblée. Les fonctions de président, de ministre ou de chef de groupe, et le travail en séance, en circonscription ou en mission n'y apparaissent pas : comparez avec prudence.",
  },
  bills: {
    label: 'Propositions de loi',
    tiers: [
      { label: '10 et plus', ...HIGHEST, test: (s) => s.billsAuthored >= 10 },
      { label: '5 à 9', ...HIGH, test: (s) => s.billsAuthored >= 5 },
      { label: '3 à 4', ...MEDIUM, test: (s) => s.billsAuthored >= 3 },
      { label: '2', ...LOW, test: (s) => s.billsAuthored === 2 },
      { label: '1', ...LOWER, test: (s) => s.billsAuthored === 1 },
      { label: 'Aucune', ...NONE, test: () => true },
    ],
    value: (s) => s.billsAuthored,
    detail: (s) => `${s.billsAuthored} déposée${s.billsAuthored > 1 ? 's' : ''}, ${s.billsCosigned} cosignée${s.billsCosigned > 1 ? 's' : ''}`,
    overview: (n, _, o) => `${n} ${o.plural} ont déposé au moins une proposition de loi comme auteur.`,
    note: "Propositions déposées à l'Assemblée comme auteur depuis le début du mandat. Une proposition peut n'être jamais discutée, et les amendements n'y figurent pas.",
  },
}

export const tierOf = (reading: Exclude<Reading, 'group'>, s: Summary) =>
  READINGS[reading].tiers.find((t) => t.test(s))!
