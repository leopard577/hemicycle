// Court decisions from Casier Politique: labels, the filter tiers shared by every page, and how a penalty reads.
// They name real people: the wording must stay factual, and a pending appeal must stay visible.
import { formatDate, formatEuro, formatMonth } from '@/lib/format'
import type { Conviction, ConvictionNature, ConvictionStatus, Penalty } from '@/types'

export const CASIER_POLITIQUE = {
  label: 'Casier Politique',
  author: 'Raphaël Jolivet',
  url: 'https://codeberg.org/raphael-jolivet/crapulopedia',
  license: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr',
}

export type ConvictionTier = 'final' | 'pending' | 'other' | 'none'

/** From most to least serious: `fill` colours a seat, `dot` a legend or list marker */
export const CONVICTION_TIERS: Record<ConvictionTier, { label: string; fill: string; dot: string }> = {
  final: { label: 'Condamnation pénale définitive', fill: 'fill-red-700', dot: 'bg-red-700' },
  pending: { label: 'Condamnation pénale, recours en cours', fill: 'fill-orange-500', dot: 'bg-orange-500' },
  other: { label: 'Décision civile ou électorale', fill: 'fill-amber-300', dot: 'bg-amber-300' },
  none: { label: 'Aucune recensée', fill: 'fill-muted-foreground/25', dot: 'bg-muted-foreground/25' },
}

/** The empty default covers a page kept as last published, from before convictions existed */
export function convictionTierOf(convictions: Conviction[] = []): ConvictionTier {
  const criminal = convictions.filter((c) => c.nature === 'criminal')
  if (criminal.some((c) => c.status === 'final')) return 'final'
  if (criminal.length) return 'pending'
  return convictions.length ? 'other' : 'none'
}

export const STATUS_LABELS: Record<ConvictionStatus, string> = {
  final: 'Définitive',
  appeal: 'Appel en cours',
  cassation: 'Pourvoi en cassation',
}

export const NATURE_LABELS: Record<ConvictionNature, string> = {
  criminal: 'Pénale',
  civil: 'Civile',
  electoral: 'Électorale',
}

const duration = (months: number) =>
  months % 12 ? `${months} mois` : `${months / 12} an${months >= 24 ? 's' : ''}`

/** "2 ans ferme", "3 ans dont 2 ans avec sursis", "12 mois avec sursis"; null without a penalty */
export function formatTerm({ total, suspended }: Penalty, firm = ' ferme') {
  if (!total) return null
  if (!suspended) return `${duration(total)}${firm}`
  if (suspended >= total) return `${duration(total)} avec sursis`
  return `${duration(total)} dont ${duration(suspended)} avec sursis`
}

const money = (n: number, currency: 'EUR' | 'FRF') =>
  currency === 'EUR' ? formatEuro(n) : `${n.toLocaleString('fr-FR')} F`

export function formatAmount({ total, suspended, currency }: Conviction['amount']) {
  if (!total) return null
  if (!suspended) return money(total, currency)
  if (suspended >= total) return `${money(total, currency)} avec sursis`
  return `${money(total, currency)} dont ${money(suspended, currency)} avec sursis`
}

/** The source falls back on 1 January or the first of the month when Wikipedia only gives the year or the month */
export function formatConvictionDate(iso: string) {
  if (iso.endsWith('-01-01')) return iso.slice(0, 4)
  return iso.endsWith('-01') ? formatMonth(iso) : formatDate(iso)
}
