import { type PointerEvent, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { hemicycleLayout } from '@/lib/hemicycle'
import type { Depute, Groupe } from '@/types'

interface Props {
  deputes: Depute[]
  groupes: Map<string, Groupe>
  selectedId: string | null
  isHighlighted: (d: Depute) => boolean
  onSelect: (d: Depute) => void
  /** Classe de remplissage selon la lecture choisie ; null = couleur du groupe */
  teinte: ((d: Depute) => string) | null
  /** Ligne ajoutée au survol selon la lecture choisie */
  detail: ((d: Depute) => string | null) | null
}

const FALLBACK_COLOR = '#8D949A'

export function Hemicycle({ deputes, groupes, selectedId, isHighlighted, onSelect, teinte, detail }: Props) {
  const layout = useMemo(() => hemicycleLayout(deputes.length), [deputes.length])
  const [hovered, setHovered] = useState<Depute | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Siège le plus proche du pointeur : sur mobile les points font 6 à 8 px, trop petits pour viser au doigt
  const auPointeur = (e: PointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    let proche = -1
    let distance = Infinity
    layout.seats.forEach((s, i) => {
      const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2
      if (d < distance) [proche, distance] = [i, d]
    })
    const rayon = (layout.seats[0]?.r ?? 0) * 2.5
    return proche >= 0 && distance <= rayon ** 2 ? deputes[proche] : null
  }

  const hoveredGroupe = hovered?.groupeId ? groupes.get(hovered.groupeId) : undefined

  return (
    <div>
      <div className="relative">
        {/* Au doigt : toucher ouvre le siège le plus proche ; glisser horizontalement fait défiler les noms au centre,
          relâcher ouvre la fiche. touch-pan-y laisse le défilement vertical de la page au navigateur. */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="list"
          aria-label="Hémicycle de l'Assemblée nationale"
          className={cn('block h-auto w-full touch-pan-y overflow-visible select-none', hovered && 'cursor-pointer')}
          onPointerDown={(e) => e.pointerType !== 'mouse' && setHovered(auPointeur(e))}
          onPointerMove={(e) => setHovered(auPointeur(e))}
          onPointerUp={(e) => {
            if (e.button !== 0) return
            const d = auPointeur(e)
            if (d) onSelect(d)
          }}
          onPointerLeave={() => setHovered(null)}
          onPointerCancel={() => setHovered(null)}
        >
          {deputes.map((d, i) => {
            const seat = layout.seats[i]
            const color = (d.groupeId && groupes.get(d.groupeId)?.couleur) || FALLBACK_COLOR
            const selected = d.id === selectedId
            const survole = d.id === hovered?.id
            return (
              <circle
                key={d.id}
                role="listitem"
                tabIndex={0}
                aria-label={`${d.prenom} ${d.nom}`}
                className={cn(
                  'stroke-background stroke-[0.3] outline-none transition-opacity duration-200',
                  'focus-visible:stroke-foreground focus-visible:stroke-[0.6]',
                  survole && 'stroke-foreground stroke-[0.6]',
                  !isHighlighted(d) && 'opacity-15',
                  selected && 'stroke-foreground stroke-[0.8]',
                  teinte?.(d),
                )}
                cx={seat.x}
                cy={seat.y}
                r={selected || survole ? seat.r * 1.35 : seat.r}
                fill={teinte ? undefined : color}
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
              {detail?.(hovered) && <span className="font-semibold text-foreground">{detail(hovered)}</span>}
            </>
          ) : (
            <>
              <strong className="font-heading text-3xl leading-none font-semibold text-foreground tabular-nums sm:text-5xl">
                {deputes.length}
              </strong>
              <span>députés</span>
            </>
          )}
        </div>
      </div>
      <p className="mt-2 hidden text-center text-xs text-muted-foreground pointer-coarse:block">
        Faites glisser le doigt sur les sièges pour lire les noms, relâchez pour ouvrir la fiche.
      </p>
    </div>
  )
}
