import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Synthese } from '@/lib/argent'
import { type Lecture, LECTURES, palier } from '@/lib/lectures'
import type { Depute, Groupe } from '@/types'

const CLASSEMENT = 10

/** Choix de la lecture de l'hémicycle */
export function ChoixLecture({ lecture, onChange }: { lecture: Lecture; onChange: (l: Lecture) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={lecture}
      onValueChange={(v) => v && onChange(v as Lecture)}
      aria-label="Colorer l'hémicycle selon"
      className="mx-auto mb-6 flex-wrap justify-center"
    >
      <ToggleGroupItem value="groupe">Groupes</ToggleGroupItem>
      {(Object.keys(LECTURES) as (keyof typeof LECTURES)[]).map((k) => (
        <ToggleGroupItem key={k} value={k}>
          {LECTURES[k].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

interface DetailProps {
  lecture: Exclude<Lecture, 'groupe'>
  deputes: Depute[]
  syntheses: Map<string, Synthese>
  groupes: Map<string, Groupe>
  onSelect: (d: Depute) => void
}

/** Échelle de couleurs, résumé chiffré et classement de la lecture active */
export function DetailLecture({ lecture, deputes, syntheses, groupes, onSelect }: DetailProps) {
  const def = LECTURES[lecture]
  const toutes = deputes.map((d) => syntheses.get(d.id)!)
  const valeur = (d: Depute) => def.valeur(syntheses.get(d.id)!)
  const classement = deputes
    .filter((d) => valeur(d) > 0)
    .sort((a, b) => valeur(b) - valeur(a))
    .slice(0, CLASSEMENT)

  return (
    <div className="mt-6 space-y-4">
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        {def.paliers.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={`size-3 rounded-full ${p.bg}`} />
            {p.label}
            <span className="text-muted-foreground tabular-nums">
              {toutes.filter((s) => palier(lecture, s) === p).length}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center font-medium">
        {def.resume(toutes.filter((s) => def.valeur(s) > 0).length, toutes)}
      </p>

      {classement.length > 0 && (
        <Card className="mx-auto w-full max-w-xl gap-0 p-2">
          <p className="px-2 pt-1 pb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Les {classement.length} premiers
          </p>
          <ol>
            {classement.map((d, i) => (
              <li key={d.id}>
                <Button variant="ghost" className="w-full justify-start gap-2 font-normal" onClick={() => onSelect(d)}>
                  <span className="w-5 text-right text-muted-foreground tabular-nums">{i + 1}</span>
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: groupes.get(d.groupeId ?? '')?.couleur }}
                  />
                  <span className="truncate">
                    {d.prenom} {d.nom}
                  </span>
                  <span className="ml-auto font-semibold tabular-nums">{def.detail(syntheses.get(d.id)!)}</span>
                </Button>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
