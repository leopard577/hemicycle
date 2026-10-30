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
