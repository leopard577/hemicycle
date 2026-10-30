// Second reading of the 2027 candidates hemicycle: what the HATVP publishes about each announced candidate
import type { AnnouncedCandidate } from '@/types'

export type HatvpTier = 'interests' | 'file' | 'none'

/** From most to least published: `fill` colours a seat, `dot` a legend or list marker */
export const HATVP_TIERS: Record<HatvpTier, { label: string; fill: string; dot: string }> = {
  interests: {
    label: "Déclaration d'intérêts publiée",
    fill: 'fill-blue-700 dark:fill-blue-400',
    dot: 'bg-blue-700 dark:bg-blue-400',
  },
  file: {
    label: 'Dossier HATVP, sans déclaration publiée',
    fill: 'fill-blue-300 dark:fill-blue-900',
    dot: 'bg-blue-300 dark:bg-blue-900',
  },
  none: {
    label: 'Aucun dossier HATVP',
    fill: 'fill-muted-foreground/25',
    dot: 'bg-muted-foreground/25',
  },
}

export const tierOf = (c: AnnouncedCandidate): HatvpTier =>
  c.hatvp?.interests ? 'interests' : c.hatvp ? 'file' : 'none'

// Third reading: total value of the company holdings in that declaration, on the deputies' capital scale
export type CapitalTier = 'million' | 'hundredK' | 'tenK' | 'low' | 'zero' | 'none'

export const CAPITAL_TIERS: Record<CapitalTier, { label: string; fill: string; dot: string }> = {
  million: { label: '1 M€ et plus', fill: 'fill-red-800', dot: 'bg-red-800' },
  hundredK: { label: '100 k€ à 1 M€', fill: 'fill-red-600', dot: 'bg-red-600' },
  tenK: { label: '10 à 100 k€', fill: 'fill-orange-500', dot: 'bg-orange-500' },
  low: { label: 'Moins de 10 k€', fill: 'fill-amber-300', dot: 'bg-amber-300' },
  zero: { label: 'Aucune valeur déclarée', fill: 'fill-blue-300 dark:fill-blue-900', dot: 'bg-blue-300 dark:bg-blue-900' },
  none: { label: "Pas de déclaration d'intérêts publiée", fill: 'fill-muted-foreground/25', dot: 'bg-muted-foreground/25' },
}

/** Sum of the declared values, a calculation by the site; null without a published declaration or holdings section */
export const capitalOf = (c: AnnouncedCandidate): number | null =>
  c.hatvp?.interests?.holdings?.reduce((sum, h) => sum + (h.value ?? 0), 0) ?? null

export const capitalTierOf = (c: AnnouncedCandidate): CapitalTier => {
  const v = capitalOf(c)
  if (v === null) return 'none'
  if (v >= 1_000_000) return 'million'
  if (v >= 100_000) return 'hundredK'
  if (v >= 10_000) return 'tenK'
  return v > 0 ? 'low' : 'zero'
}
