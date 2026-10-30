import { type PointerEvent, type ReactNode, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { hemicycleLayout } from '@/lib/hemicycle'
import type { Group } from '@/types'

/** What a seat needs: parliamentarians, or announced candidates with their political family as group */
export interface HemicycleMember {
  id: string
  firstName: string
  lastName: string
  groupId: string | null
}

interface Props<T extends HemicycleMember> {
  /** Seat order: `members[i]` sits on seat `i` */
  members: T[]
  groups: Map<string, Group>
  selectedId: string | null
  isHighlighted: (m: T) => boolean
  onSelect: (m: T) => void
  /** Fill class for the chosen reading; null = group colour */
  tint: ((m: T) => string) | null
  /** Line added on hover for the chosen reading */
  detail: ((m: T) => string | null) | null
  /** Constituency line shown on hover */
  place: (m: T) => ReactNode
  /** Accessible name of the chart */
  label: string
  /** Word under the seat count in the centre ("députés") */
  countLabel: string
  /** Rows of seats: 12 suit a chamber, fewer a small field */
  rows?: number
  /**
   * Name written along each seat's radius, towards the centre: for a small field on a single row. `compact` is shown
   * on a phone, `full` from md up
   */
  seatLabel?: { compact: (m: T) => string; full: (m: T) => string }
}

const FALLBACK_COLOR = '#8D949A'

export function Hemicycle<T extends HemicycleMember>({
  members,
  groups,
  selectedId,
  isHighlighted,
  onSelect,
  tint,
  detail,
  place,
  label,
  countLabel,
  rows,
  seatLabel,
}: Props<T>) {
  const layout = useMemo(() => hemicycleLayout(members.length, rows), [members.length, rows])
  const [hovered, setHovered] = useState<T | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Seat closest to the pointer: on a phone the dots are 6 to 8 px wide, too small to aim at with a finger
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
    const radius = (layout.seats[0]?.r ?? 0) * 2.5
    return closest >= 0 && distance <= radius ** 2 ? members[closest] : null
  }

  const hoveredGroup = hovered?.groupId ? groups.get(hovered.groupId) : undefined

  return (
    <div>
      <div className="relative">
        {/* By touch: tapping opens the closest seat; sliding sideways previews names in the centre, releasing
          opens the panel. touch-pan-y leaves vertical page scrolling to the browser. */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="list"
          aria-label={label}
          className={cn('block h-auto w-full touch-pan-y overflow-visible select-none', hovered && 'cursor-pointer')}
          onPointerDown={(e) => e.pointerType !== 'mouse' && setHovered(seatAtPointer(e))}
          onPointerMove={(e) => setHovered(seatAtPointer(e))}
          onPointerUp={(e) => {
            if (e.button !== 0) return
            const d = seatAtPointer(e)
            if (d) onSelect(d)
          }}
          onPointerLeave={() => setHovered(null)}
          onPointerCancel={() => setHovered(null)}
        >
          {members.map((d, i) => {
            const seat = layout.seats[i]
            const color = (d.groupId && groups.get(d.groupId)?.color) || FALLBACK_COLOR
            const selected = d.id === selectedId
            const isHovered = d.id === hovered?.id
            return (
              <circle
                key={d.id}
                role="listitem"
                tabIndex={0}
                aria-label={`${d.firstName} ${d.lastName}`}
                className={cn(
                  'stroke-background stroke-[0.3] outline-none transition-opacity duration-200',
                  'focus-visible:stroke-foreground focus-visible:stroke-[0.6]',
                  isHovered && 'stroke-foreground stroke-[0.6]',
                  !isHighlighted(d) && 'opacity-15',
                  selected && 'stroke-foreground stroke-[0.8]',
                  tint?.(d),
                )}
                cx={seat.x}
                cy={seat.y}
                r={selected || isHovered ? seat.r * 1.35 : seat.r}
                fill={tint ? undefined : color}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(d)
                  }
                }}
                onFocus={() => setHovered(d)}
                onBlur={() => setHovered(null)}
              />
            )
          })}
          {seatLabel && (
            <g aria-hidden className="pointer-events-none">
              {members.map((d, i) => {
                const seat = layout.seats[i]
                // The arc's centre is at (width / 2, width / 2): see hemicycleLayout
                const c = layout.width / 2
                const [dx, dy] = [c - seat.x, c - seat.y]
                const length = Math.hypot(dx, dy) || 1
                const gap = seat.r * 1.6
                // Text starts next to the seat and runs inwards; on the right half it is turned around to stay
                // readable, so it ends next to the seat instead
                const left = seat.x < c
                const angle = (Math.atan2(left ? dy : -dy, left ? dx : -dx) * 180) / Math.PI
                const x = seat.x + (dx / length) * gap
                const y = seat.y + (dy / length) * gap
                const emphasis = d.id === selectedId || d.id === hovered?.id
                return (
                  <text
                    key={d.id}
                    x={x}
                    y={y}
                    transform={`rotate(${angle} ${x} ${y})`}
                    textAnchor={left ? 'start' : 'end'}
                    dominantBaseline="central"
                    className={cn(
                      'fill-muted-foreground text-[6.4px] transition-opacity duration-200 md:text-[3.6px]',
                      emphasis && 'fill-foreground font-semibold',
                      !isHighlighted(d) && 'opacity-25',
                    )}
                  >
                    <tspan className="md:hidden">{seatLabel.compact(d)}</tspan>
                    <tspan className="max-md:hidden">{seatLabel.full(d)}</tspan>
                  </text>
                )
              })}
            </g>
          )}
        </svg>

        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-0 left-1/2 flex w-[32%] -translate-x-1/2 flex-col items-center gap-0.5 text-center text-xs text-muted-foreground sm:text-sm"
        >
          {hovered ? (
            <>
              <strong className="font-heading text-sm leading-tight font-semibold text-foreground sm:text-xl">
                {hovered.firstName} {hovered.lastName}
              </strong>
              <span className="font-bold brightness-90" style={{ color: hoveredGroup?.color }}>
                {hoveredGroup?.abbrev ?? 'Sans groupe'}
              </span>
              <span>{place(hovered)}</span>
              {detail?.(hovered) && <span className="font-semibold text-foreground">{detail(hovered)}</span>}
            </>
          ) : (
            <>
              <strong className="font-heading text-3xl leading-none font-semibold text-foreground tabular-nums sm:text-5xl">
                {members.length}
              </strong>
              <span>{countLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
