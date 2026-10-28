import type { Seat } from '@/lib/hemicycle'
import type { GovernmentMember, GovernmentRank } from '@/types'

/** "Ministre déléguée", "Premier ministre"…: the rank, shown above the name */
export function rankLabel(m: GovernmentMember) {
  const feminine = m.honorific === 'Mme'
  switch (m.rank) {
    case 'president':
      return feminine ? 'Présidente de la République' : 'Président de la République'
    case 'pm':
      return feminine ? 'Première ministre' : 'Premier ministre'
    case 'minister':
      return 'Ministre'
    case 'delegate':
      return feminine ? 'Ministre déléguée' : 'Ministre délégué'
  }
}

/** ISO date moved by whole months and days, in UTC so that no time zone shifts the day */
function shiftDate(iso: string, months: number, days = 0) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + months, d + days)).toISOString().slice(0, 10)
}

/**
 * The President's five-year term and the window of the end-of-term asset declaration: "six mois au plus tôt et
 * cinq mois au plus tard avant l'expiration du mandat" (art. 3 of law no. 62-1292 of 6 November 1962).
 * A term that starts on 14 May 2022 expires on 13 May 2027.
 */
export function presidentialTerm(startDate: string, now = Date.now()) {
  const end = shiftDate(startDate, 60, -1)
  const declarationFrom = shiftDate(end, -6)
  const declarationBy = shiftDate(end, -5)
  const today = new Date(now).toISOString().slice(0, 10)
  const phase = today < declarationFrom ? 'upcoming' : today <= declarationBy ? 'open' : 'past'
  return { end, declarationFrom, declarationBy, phase }
}

/**
 * Title of a minister delegate shown under `head`, without the "auprès de" part that the layout already says:
 * "Chargée de l'énergie". The full title when nothing is left or the wording does not match.
 */
export function roleUnder(m: GovernmentMember, head: GovernmentMember) {
  const after = m.role.replace(/^Ministre déléguée? auprès (?:du|de la) /, '')
  const headTitle = head.rank === 'pm' ? 'Premier ministre' : `m${head.role.slice(1)}`
  if (!after.startsWith(`${headTitle}, `)) return m.role
  const rest = after.slice(headTitle.length + 2)
  return rest[0].toUpperCase() + rest.slice(1)
}

/**
 * Legend of the council table, in protocol order. Ministers are filled discs, ministers delegate hollow ones:
 * a delegate has no ministry of their own.
 */
export const RANKS: { rank: GovernmentRank; label: string; seat: string; initials: string }[] = [
  {
    rank: 'president',
    label: 'Président de la République',
    seat: 'fill-blue-800 stroke-blue-800 dark:fill-blue-400 dark:stroke-blue-400',
    initials: 'fill-white dark:fill-blue-950',
  },
  {
    rank: 'pm',
    label: 'Premier ministre',
    seat: 'fill-red-600 stroke-red-600 dark:fill-red-400 dark:stroke-red-400',
    initials: 'fill-white dark:fill-red-950',
  },
  {
    rank: 'minister',
    label: 'Ministres',
    seat: 'fill-slate-700 stroke-slate-700 dark:fill-slate-300 dark:stroke-slate-300',
    initials: 'fill-white dark:fill-slate-900',
  },
  {
    rank: 'delegate',
    label: 'Ministres délégués',
    seat: 'fill-background stroke-slate-500 dark:stroke-slate-400',
    initials: 'fill-foreground',
  },
]

export const rankStyle = (rank: GovernmentRank) => RANKS.find((r) => r.rank === rank)!

export interface TableLayout {
  seats: Seat[]
  width: number
  height: number
  /** The table top, a stadium: straight sides between two half circles */
  table: { x: number; y: number; width: number; height: number }
}

/**
 * Seats around the table of the Conseil des ministres, after its protocol: the President in the middle of the top
 * side, the Prime Minister facing him, and the others alternating to their right and left, moving outwards in
 * the order of the decree. `members[i]` sits on `seats[i]`, so pass the members in decree order.
 */
export function councilTableLayout(count: number): TableLayout {
  const straight = 100
  const tableRadius = 20
  const seatRadius = 4.2
  const track = tableRadius + seatRadius + 3.5
  const pad = seatRadius * 1.6
  const cx = track + pad + straight / 2
  const cy = track + pad
  const perimeter = 2 * straight + 2 * Math.PI * track

  // Seat k lies at distance k * step along the track, clockwise from the middle of the top side
  const step = perimeter / count
  const pointAt = (d: number): Seat => {
    const half = straight / 2
    const arc = Math.PI * track
    d = ((d % perimeter) + perimeter) % perimeter
    if (d < half) return { x: cx + d, y: cy - track, r: seatRadius }
    d -= half
    if (d < arc) {
      const a = -Math.PI / 2 + d / track
      return { x: cx + half + track * Math.cos(a), y: cy + track * Math.sin(a), r: seatRadius }
    }
    d -= arc
    if (d < straight) return { x: cx + half - d, y: cy + track, r: seatRadius }
    d -= straight
    if (d < arc) {
      const a = Math.PI / 2 + d / track
      return { x: cx - half + track * Math.cos(a), y: cy + track * Math.sin(a), r: seatRadius }
    }
    return { x: cx - half + (d - arc), y: cy - track, r: seatRadius }
  }
  const positions = Array.from({ length: count }, (_, k) => pointAt(k * step))

  // Protocol order of the positions. Both heads face the table, so their right hand is the previous position
  // clockwise: for each distance, the President's right, his left, then the Prime Minister's right and left.
  const head = Math.round(count / 2)
  const order = [0, head]
  for (let d = 1; order.length < count; d++)
    for (const k of [-d, d, head - d, head + d]) {
      const i = ((k % count) + count) % count
      if (!order.includes(i)) order.push(i)
    }

  return {
    seats: order.slice(0, count).map((i) => positions[i]),
    width: 2 * cx,
    height: 2 * cy,
    table: { x: cx - straight / 2 - tableRadius, y: cy - tableRadius, width: straight + 2 * tableRadius, height: 2 * tableRadius },
  }
}
