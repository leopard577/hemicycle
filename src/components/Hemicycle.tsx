import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { hemicycleLayout } from '@/lib/hemicycle'
import type { Depute, Groupe } from '@/types'

interface Props {
  deputes: Depute[]
  groupes: Map<string, Groupe>
  selectedId: string | null
  isHighlighted: (d: Depute) => boolean
  onSelect: (d: Depute) => void
}

const FALLBACK_COLOR = '#8D949A'

export function Hemicycle({ deputes, groupes, selectedId, isHighlighted, onSelect }: Props) {
  const layout = useMemo(() => hemicycleLayout(deputes.length), [deputes.length])
  const [hovered, setHovered] = useState<Depute | null>(null)

  const hoveredGroupe = hovered?.groupeId ? groupes.get(hovered.groupeId) : undefined

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="list"
        aria-label="Hémicycle de l'Assemblée nationale"
        className="block h-auto w-full overflow-visible"
      >
        {deputes.map((d, i) => {
          const seat = layout.seats[i]
          const color = (d.groupeId && groupes.get(d.groupeId)?.couleur) || FALLBACK_COLOR
          const selected = d.id === selectedId
          return (
            <circle
              key={d.id}
              role="listitem"
              tabIndex={0}
              aria-label={`${d.prenom} ${d.nom}`}
              className={cn(
                'cursor-pointer stroke-background stroke-[0.3] outline-none transition-opacity duration-200',
                'hover:stroke-foreground hover:stroke-[0.6] focus-visible:stroke-foreground focus-visible:stroke-[0.6]',
                !isHighlighted(d) && 'opacity-15',
                selected && 'stroke-foreground stroke-[0.8]',
              )}
              cx={seat.x}
              cy={seat.y}
              r={selected ? seat.r * 1.35 : seat.r}
              fill={color}
              onClick={() => onSelect(d)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(d)
                }
              }}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(d)}
              onBlur={() => setHovered(null)}
            />
          )
        })}
      </svg>

      <div
        aria-live="polite"
        className="pointer-events-none absolute bottom-0 left-1/2 flex w-[30%] -translate-x-1/2 flex-col items-center gap-0.5 text-center text-sm text-muted-foreground"
      >
        {hovered ? (
          <>
            <strong className="text-lg text-foreground">
              {hovered.prenom} {hovered.nom}
            </strong>
            <span className="font-bold brightness-90" style={{ color: hoveredGroupe?.couleur }}>
              {hoveredGroupe?.abrev ?? 'Sans groupe'}
            </span>
            {hovered.departement && (
              <span>
                {hovered.departement} ({hovered.numDepartement}) · {hovered.numCirco}
                <sup>{hovered.numCirco === '1' ? 're' : 'e'}</sup> circ.
              </span>
            )}
          </>
        ) : (
          <>
            <strong className="text-4xl leading-none text-foreground tabular-nums">{deputes.length}</strong>
            <span>députés</span>
          </>
        )}
      </div>
    </div>
  )
}
