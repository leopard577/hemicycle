// Lectures de l'hémicycle : chaque siège est coloré selon un indicateur tiré de `synthese`
import type { Synthese } from '@/lib/argent'
import { formatEuro } from '@/lib/format'

export type Lecture = 'groupe' | 'cumuls' | 'annexes' | 'alertes'

interface Palier {
  label: string
  fill: string
  bg: string
  test: (s: Synthese) => boolean
}

interface Definition {
  label: string
  paliers: Palier[]
  /** Valeur de tri du classement ; 0 = absent du classement */
  valeur: (s: Synthese) => number
  detail: (s: Synthese) => string | null
  resume: (concernes: number, syntheses: Synthese[]) => string
}

const AUCUN = { fill: 'fill-muted-foreground/25', bg: 'bg-muted-foreground/25' }

// Paliers du plus fort au plus faible : le premier qui correspond donne la couleur
export const LECTURES: Record<Exclude<Lecture, 'groupe'>, Definition> = {
  cumuls: {
    label: 'Cumul de mandats',
    paliers: [
      { label: '3 et plus', fill: 'fill-red-600', bg: 'bg-red-600', test: (s) => s.cumuls >= 3 },
      { label: '2', fill: 'fill-orange-500', bg: 'bg-orange-500', test: (s) => s.cumuls === 2 },
      { label: '1', fill: 'fill-amber-300', bg: 'bg-amber-300', test: (s) => s.cumuls === 1 },
      { label: 'Aucun', ...AUCUN, test: () => true },
    ],
    valeur: (s) => s.cumuls,
    detail: (s) =>
      s.cumuls ? `${s.cumuls} mandat${s.cumuls > 1 ? 's' : ''} ou activité${s.cumuls > 1 ? 's' : ''} en plus` : null,
    resume: (n) => `${n} députés exercent au moins un autre mandat ou une activité rémunérée en même temps.`,
  },
  annexes: {
    label: 'Autres revenus',
    paliers: [
      { label: '60 k€ et plus', fill: 'fill-red-800', bg: 'bg-red-800', test: (s) => s.annexes >= 60_000 },
      { label: '30 à 60 k€', fill: 'fill-red-600', bg: 'bg-red-600', test: (s) => s.annexes >= 30_000 },
      { label: '10 à 30 k€', fill: 'fill-orange-500', bg: 'bg-orange-500', test: (s) => s.annexes >= 10_000 },
      { label: 'Moins de 10 k€', fill: 'fill-amber-300', bg: 'bg-amber-300', test: (s) => s.annexes > 0 },
      { label: 'Aucun', ...AUCUN, test: () => true },
    ],
    valeur: (s) => s.annexes,
    detail: (s) => (s.annexes > 0 ? `+${formatEuro(s.annexes, { round: true })} par an` : null),
    resume: (n, syntheses) =>
      `${n} députés déclarent des revenus en plus de leur indemnité : ${formatEuro(
        syntheses.reduce((sum, s) => sum + s.annexes, 0),
        { compact: true },
      )} par an au total.`,
  },
  alertes: {
    label: 'Déclarations',
    paliers: [
      {
        label: 'Fonction incompatible ou déclaration absente',
        fill: 'fill-red-600',
        bg: 'bg-red-600',
        test: (s) => s.graves > 0,
      },
      {
        label: 'Déclaration en retard ou incomplète',
        fill: 'fill-orange-500',
        bg: 'bg-orange-500',
        test: (s) => s.attention > 0,
      },
      { label: 'Rien à signaler', ...AUCUN, test: () => true },
    ],
    valeur: (s) => s.graves * 10 + s.attention,
    detail: (s) => {
      const n = s.graves + s.attention
      return n ? `${n} signalement${n > 1 ? 's' : ''}` : null
    },
    resume: (n) =>
      `${n} députés ont au moins un point signalé dans leurs déclarations, en comparant les registres de l'Assemblée, de la HATVP et du Répertoire national des élus.`,
  },
}

export const palier = (lecture: Exclude<Lecture, 'groupe'>, s: Synthese) =>
  LECTURES[lecture].paliers.find((p) => p.test(s))!
