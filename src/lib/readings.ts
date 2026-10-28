// Hemicycle readings: every seat is coloured according to an indicator taken from `summary`
import type { Summary } from '@/lib/money'
import { formatEuro } from '@/lib/format'

export type Reading = 'group' | 'overlaps' | 'sideIncome' | 'capital' | 'alerts'

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
  detail: (s: Summary) => string | null
  overview: (count: number, summaries: Summary[]) => string
}

const NONE = { fill: 'fill-muted-foreground/25', bg: 'bg-muted-foreground/25' }

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
    overview: (n) => `${n} députés exercent au moins un autre mandat ou une activité rémunérée en même temps.`,
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
    overview: (n, summaries) =>
      `${n} députés déclarent des revenus en plus de leur indemnité : ${formatEuro(
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
    overview: (n, summaries) =>
      `${n} députés déclarent des parts dans des sociétés, pour une valeur totale de ${formatEuro(
        summaries.reduce((sum, s) => sum + s.capital, 0),
        { compact: true },
      )}. Le patrimoine immobilier et l'épargne n'y figurent pas.`,
  },
  alerts: {
    label: 'Déclarations',
    tiers: [
      {
        label: 'Fonction incompatible ou déclaration absente',
        fill: 'fill-red-600',
        bg: 'bg-red-600',
        test: (s) => s.serious > 0,
      },
      {
        label: 'Déclaration en retard ou incomplète',
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
    overview: (n) =>
      `${n} députés ont au moins un point signalé dans leurs déclarations, en comparant les registres de l'Assemblée, de la HATVP et du Répertoire national des élus.`,
  },
}

export const tierOf = (reading: Exclude<Reading, 'group'>, s: Summary) =>
  READINGS[reading].tiers.find((t) => t.test(s))!
