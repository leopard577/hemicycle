import { type PointerEvent, type ReactNode, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { hemicycleLayout } from '@/lib/hemicycle'
import type { Group, Parliamentarian } from '@/types'

interface Props<T extends Parliamentarian> {
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
}

const FALLBACK_COLOR = '#8D949A'

export function Hemicycle<T extends Parliamentarian>({
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
}: Props<T>) {
  const layout = useMemo(() => hemicycleLayout(members.length), [members.length])
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
