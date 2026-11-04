import type { ReactNode } from 'react'
import { ConvictionsCaveat } from '@/components/panel/Convictions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Summary } from '@/lib/money'
import type { Office } from '@/lib/offices'
import { type Reading, READINGS, tierOf } from '@/lib/readings'
import type { Official } from '@/types'

const RANKING_SIZE = 10

/** Choice of the chart reading. `baseLabel` names the default colouring ("Groupes", "Rangs") */
export function ReadingPicker({
  reading,
  onChange,
  baseLabel = 'Groupes',
  label = "Colorer l'hémicycle selon",
  omit = [],
}: {
  reading: Reading
  onChange: (r: Reading) => void
  baseLabel?: string
  label?: string
  /** Readings without any data on this page */
  omit?: Reading[]
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={reading}
      onValueChange={(v) => v && onChange(v as Reading)}
      aria-label={label}
      className="mx-auto mb-6 flex-wrap justify-center"
    >
      <ToggleGroupItem value="group">{baseLabel}</ToggleGroupItem>
      {(Object.keys(READINGS) as (keyof typeof READINGS)[])
        .filter((k) => !omit.includes(k))
        .map((k) => (
          <ToggleGroupItem key={k} value={k}>
            {READINGS[k].label}
          </ToggleGroupItem>
        ))}
    </ToggleGroup>
  )
}

interface DetailProps<T extends Official> {
  reading: Exclude<Reading, 'group'>
  members: T[]
  summaries: Map<string, Summary>
  /** Small mark before a name in the ranking: group colour, rank… */
  marker: (m: T) => ReactNode
  office: Office
  onSelect: (m: T) => void
  /** Label of the tier that filters the chart; without `onTierChange`, the tiers are a plain legend */
  activeTier?: string | null
  onTierChange?: (label: string | null) => void
}

/** Colour scale, overview figure and ranking for the active reading */
export function ReadingDetail<T extends Official>({
  reading,
  members,
  summaries,
  marker,
  office,
  onSelect,
  activeTier,
  onTierChange,
}: DetailProps<T>) {
  const def = READINGS[reading]
  const all = members.map((m) => summaries.get(m.id)!)
  const value = (m: T) => def.value(summaries.get(m.id)!)
  const countOf = (label: string) => all.filter((s) => tierOf(reading, s).label === label).length
  const ranking = members
    .filter((d) => value(d) > 0 && (!def.listAll || !activeTier || tierOf(reading, summaries.get(d.id)!).label === activeTier))
    .sort((a, b) => value(b) - value(a))
    .slice(0, def.listAll ? undefined : RANKING_SIZE)

  return (
    <div className="mt-6 space-y-4">
      {onTierChange ? (
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={activeTier ?? ''}
          onValueChange={(v) => onTierChange(v || null)}
          aria-label={`Filtrer selon : ${def.label}`}
          className="mx-auto w-full flex-wrap justify-center"
        >
          {def.tiers.map((t) => (
            <ToggleGroupItem key={t.label} value={t.label} className="rounded-full data-[state=on]:border-foreground">
              <span className={`size-2.5 shrink-0 rounded-full ${t.bg}`} />
              <span className="font-semibold">{t.label}</span>
              <span className="text-muted-foreground tabular-nums">{countOf(t.label)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {def.tiers.map((t) => (
            <li key={t.label} className="flex items-center gap-1.5">
              <span className={`size-3 rounded-full ${t.bg}`} />
              {t.label}
              <span className="text-muted-foreground tabular-nums">{countOf(t.label)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-center font-medium">{def.overview(all.filter((s) => def.value(s) > 0).length, all, office)}</p>
      {reading === 'convictions' && <ConvictionsCaveat className="mx-auto max-w-2xl text-center text-balance" />}

      {ranking.length > 0 && (
        <Card className="mx-auto w-full max-w-xl gap-0 p-2">
          <p className="px-2 pt-1 pb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {def.listAll ? `${ranking.length} ${ranking.length > 1 ? office.plural : office.noun}` : `Les ${ranking.length} premiers`}
          </p>
          <ol>
            {ranking.map((d, i) => (
              <li key={d.id}>
                <Button variant="ghost" className="w-full justify-start gap-2 font-normal" onClick={() => onSelect(d)}>
                  {!def.listAll && <span className="w-5 text-right text-muted-foreground tabular-nums">{i + 1}</span>}
                  {marker(d)}
                  <span className="truncate">
                    {d.firstName} {d.lastName}
                  </span>
                  <span className="ml-auto font-semibold tabular-nums">{def.detail(summaries.get(d.id)!)}</span>
                </Button>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
