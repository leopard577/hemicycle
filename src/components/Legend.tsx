import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Groupe } from '@/types'

interface Props {
  groupes: Groupe[]
  counts: Map<string, number>
  activeId: string | null
  onChange: (id: string | null) => void
}

export function Legend({ groupes, counts, activeId, onChange }: Props) {
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
      {groupes.map((g) => (
        <ToggleGroupItem
          key={g.id}
          value={g.id}
          title={g.libelle}
          className="rounded-full data-[state=on]:border-foreground"
        >
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: g.couleur }} />
          <span className="font-semibold">{g.abrev}</span>
          <span className="text-muted-foreground tabular-nums">{counts.get(g.id) ?? 0}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
