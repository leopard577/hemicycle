import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Summary } from '@/lib/money'
import type { Office } from '@/lib/offices'
import { type Reading, READINGS, tierOf } from '@/lib/readings'
import type { Group, Parliamentarian } from '@/types'

const RANKING_SIZE = 10

/** Choice of the hemicycle reading */
export function ReadingPicker({ reading, onChange }: { reading: Reading; onChange: (r: Reading) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={reading}
      onValueChange={(v) => v && onChange(v as Reading)}
      aria-label="Colorer l'hémicycle selon"
      className="mx-auto mb-6 flex-wrap justify-center"
    >
      <ToggleGroupItem value="group">Groupes</ToggleGroupItem>
      {(Object.keys(READINGS) as (keyof typeof READINGS)[]).map((k) => (
        <ToggleGroupItem key={k} value={k}>
          {READINGS[k].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

interface DetailProps<T extends Parliamentarian> {
  reading: Exclude<Reading, 'group'>
  members: T[]
  summaries: Map<string, Summary>
  groups: Map<string, Group>
  office: Office
  onSelect: (m: T) => void
}

/** Colour scale, overview figure and ranking for the active reading */
export function ReadingDetail<T extends Parliamentarian>({
  reading,
  members,
  summaries,
  groups,
  office,
  onSelect,
}: DetailProps<T>) {
  const def = READINGS[reading]
  const all = members.map((m) => summaries.get(m.id)!)
  const value = (m: T) => def.value(summaries.get(m.id)!)
  const ranking = members
    .filter((d) => value(d) > 0)
    .sort((a, b) => value(b) - value(a))
    .slice(0, RANKING_SIZE)

  return (
    <div className="mt-6 space-y-4">
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        {def.tiers.map((t) => (
          <li key={t.label} className="flex items-center gap-1.5">
            <span className={`size-3 rounded-full ${t.bg}`} />
            {t.label}
            <span className="text-muted-foreground tabular-nums">
              {all.filter((s) => tierOf(reading, s) === t).length}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center font-medium">{def.overview(all.filter((s) => def.value(s) > 0).length, all, office)}</p>

      {ranking.length > 0 && (
        <Card className="mx-auto w-full max-w-xl gap-0 p-2">
          <p className="px-2 pt-1 pb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Les {ranking.length} premiers
          </p>
          <ol>
            {ranking.map((d, i) => (
              <li key={d.id}>
                <Button variant="ghost" className="w-full justify-start gap-2 font-normal" onClick={() => onSelect(d)}>
                  <span className="w-5 text-right text-muted-foreground tabular-nums">{i + 1}</span>
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: groups.get(d.groupId ?? '')?.color }}
                  />
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
