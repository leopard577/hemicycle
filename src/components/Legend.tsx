import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Group } from '@/types'

interface Props {
  groups: Group[]
  counts: Map<string, number>
  activeId: string | null
  onChange: (id: string | null) => void
}

export function Legend({ groups, counts, activeId, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      value={activeId ?? ''}
      onValueChange={(v) => onChange(v || null)}
      aria-label="Filtrer par groupe politique"
      className="mx-auto mt-8 mb-4 w-full flex-wrap justify-center"
    >
      {groups.map((g) => (
        <ToggleGroupItem
          key={g.id}
          value={g.id}
          title={g.label}
          className="rounded-full data-[state=on]:border-foreground"
        >
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
          <span className="font-semibold">{g.abbrev}</span>
          <span className="text-muted-foreground tabular-nums">{counts.get(g.id) ?? 0}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
