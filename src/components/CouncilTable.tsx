import { type PointerEvent, useMemo, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatEuro } from '@/lib/format'
import { councilTableLayout, rankLabel, rankStyle } from '@/lib/government'
import { cn } from '@/lib/utils'
import type { GovernmentMember, GovernmentPayScales } from '@/types'

interface Props {
  /** Decree order: `members[i]` sits on seat `i` of `councilTableLayout` */
  members: GovernmentMember[]
  payScales: GovernmentPayScales
  selectedId: string | null
  onSelect: (m: GovernmentMember) => void
  /** Fill class for the chosen reading; null = rank colours */
  tint: ((m: GovernmentMember) => string) | null
  /** Line added on hover for the chosen reading */
  detail: ((m: GovernmentMember) => string | null) | null
}

/** Members linked to `m` by "auprès de": its delegates, or the heads a delegate is placed with */
function linksOf(m: GovernmentMember, members: GovernmentMember[]) {
  return members.filter((o) => o.reportsTo.includes(m.id) || m.reportsTo.includes(o.id))
}

/** The Government around the table of the Conseil des ministres, in protocol order */
export function CouncilTable({ members, payScales, selectedId, onSelect, tint, detail }: Props) {
  const layout = useMemo(() => councilTableLayout(members.length), [members.length])
  const [hovered, setHovered] = useState<GovernmentMember | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const seatOf = useMemo(() => new Map(members.map((m, i) => [m.id, layout.seats[i]])), [members, layout])

  // Seat closest to the pointer, so that a finger does not have to hit a small disc
  const seatAtPointer = (e: PointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    let closest = -1
    let distance = Infinity
    layout.seats.forEach((s, i) => {
      const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2
      if (d < distance) [closest, distance] = [i, d]
    })
    const radius = (layout.seats[0]?.r ?? 0) * 1.8
    return closest >= 0 && distance <= radius ** 2 ? members[closest] : null
  }

  // Hovering a minister lights up their delegates, and a delegate the minister(s) they work with. Not under a
  // reading, where every seat's colour has to stay visible to compare them.
  const focus = tint ? null : (hovered ?? members.find((m) => m.id === selectedId) ?? null)
  const links = focus ? linksOf(focus, members) : []
  const lit = focus && links.length ? new Set([focus.id, ...links.map((l) => l.id)]) : null
  const { table } = layout
  const centre = { x: layout.width / 2, y: layout.height / 2 }

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="list"
          aria-label="Table du Conseil des ministres"
          className={cn('block h-auto w-full touch-pan-y overflow-visible select-none', hovered && 'cursor-pointer')}
          onPointerDown={(e) => e.pointerType !== 'mouse' && setHovered(seatAtPointer(e))}
          onPointerMove={(e) => setHovered(seatAtPointer(e))}
          onPointerUp={(e) => {
            if (e.button !== 0) return
            const m = seatAtPointer(e)
            if (m) onSelect(m)
          }}
          onPointerLeave={() => setHovered(null)}
          onPointerCancel={() => setHovered(null)}
        >
          <rect
            x={table.x}
            y={table.y}
            width={table.width}
            height={table.height}
            rx={table.height / 2}
            className="fill-muted stroke-border stroke-[0.4]"
          />

          {focus &&
            links.map((l) => {
              const a = seatOf.get(focus.id)!
              const b = seatOf.get(l.id)!
              // Bent a third of the way towards the centre, so the line stays clear of the label on the table
              const qx = (a.x + b.x) / 2 + (centre.x - (a.x + b.x) / 2) / 3
              const qy = (a.y + b.y) / 2 + (centre.y - (a.y + b.y) / 2) / 3
              return (
                <path
                  key={l.id}
                  d={`M ${a.x} ${a.y} Q ${qx} ${qy} ${b.x} ${b.y}`}
                  className="fill-none stroke-foreground/35 stroke-[0.4]"
                  strokeDasharray="1.2 1"
                />
              )
            })}

          {members.map((m, i) => {
            const seat = layout.seats[i]
            const style = rankStyle(m.rank)
            const selected = m.id === selectedId
            const big = selected || m.id === hovered?.id
            return (
              <g
                key={m.id}
                role="listitem"
                tabIndex={0}
                aria-label={`${m.firstName} ${m.lastName}, ${m.role}`}
                className={cn(
                  'group outline-none transition-opacity duration-200',
                  lit && !lit.has(m.id) && 'opacity-25',
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(m)
                  }
                }}
                onFocus={() => setHovered(m)}
                onBlur={() => setHovered(null)}
              >
                {big && (
                  <circle
                    cx={seat.x}
                    cy={seat.y}
                    r={seat.r * 1.45}
                    className="fill-none stroke-foreground stroke-[0.5]"
                  />
                )}
                <circle
                  cx={seat.x}
                  cy={seat.y}
                  r={big ? seat.r * 1.2 : seat.r}
                  className={cn(
                    'stroke-[0.6] group-focus-visible:stroke-foreground',
                    tint ? cn('stroke-background', tint(m)) : style.seat,
                  )}
                />
                <text
                  x={seat.x}
                  y={seat.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn(
                    'pointer-events-none hidden text-[3px] font-semibold',
                    // Under a reading the colour scale carries the meaning: no initials over it
                    !tint && 'sm:inline',
                    style.initials,
                  )}
                >
                  {m.firstName[0]}
                  {m.lastName[0]}
                </text>
              </g>
            )
          })}
        </svg>

        {/* The table top shows who is hovered, like the centre of the hemicycle. The insets are the table's place
          in `councilTableLayout`, which does not depend on the number of seats. */}
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-x-[8.5%] inset-y-[21%] flex items-center justify-center gap-3 px-[10%] text-center"
        >
          {hovered ? (
            <div className="flex items-center gap-3 rounded-lg bg-muted/90 p-2">
              <Avatar className="hidden size-14 shrink-0 sm:flex">
                <AvatarImage src={hovered.photo} alt="" className="object-cover" />
                <AvatarFallback className="font-heading text-base font-bold">
                  {hovered.firstName[0]}
                  {hovered.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-0.5 sm:text-left">
                <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase sm:text-xs">
                  {rankLabel(hovered)}
                </p>
                <p className="font-heading text-sm leading-tight font-semibold sm:text-xl">
                  {hovered.firstName} {hovered.lastName}
                </p>
                <p className="line-clamp-1 text-xs text-muted-foreground sm:line-clamp-2 sm:text-sm">{hovered.role}</p>
                {detail?.(hovered) ? (
                  <p className="text-xs font-semibold tabular-nums sm:text-sm">{detail(hovered)}</p>
                ) : (
                  <p className="hidden text-sm font-semibold tabular-nums sm:block">
                    {formatEuro(payScales.ranks[hovered.rank].gross, {
                      round: true,
                    })}{' '}
                    brut / mois
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground sm:text-sm">
              <strong className="font-heading text-3xl leading-none font-semibold text-foreground tabular-nums sm:text-5xl">
                {members.length}
              </strong>
              <span>autour de la table du Conseil des ministres</span>
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 hidden text-center text-xs text-muted-foreground pointer-coarse:block">
        Faites glisser le doigt autour de la table pour lire les noms, relâchez pour ouvrir la fiche.
      </p>
    </div>
  )
}
