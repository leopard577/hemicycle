import { useCallback, useEffect, useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { DeputyPanel } from '@/components/DeputyPanel'
import { Hemicycle } from '@/components/Hemicycle'
import { Legend } from '@/components/Legend'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Dataset, Depute } from '@/types'

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export default function App() {
  const [data, setData] = useState<Dataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/deputes.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Dataset>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  const groupes = useMemo(() => new Map(data?.groupes.map((g) => [g.id, g])), [data])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    data?.deputes.forEach((d) => d.groupeId && m.set(d.groupeId, (m.get(d.groupeId) ?? 0) + 1))
    return m
  }, [data])

  const q = normalize(query.trim())
  const isHighlighted = useCallback(
    (d: Depute) => {
      if (groupFilter && d.groupeId !== groupFilter) return false
      if (!q) return true
      return normalize(`${d.prenom} ${d.nom} ${d.departement ?? ''} ${d.numDepartement ?? ''}`).includes(q)
    },
    [groupFilter, q],
  )

  const matches = useMemo(
    () => (data && (q || groupFilter) ? data.deputes.filter(isHighlighted) : []),
    [data, q, groupFilter, isHighlighted],
  )

  const selected = data?.deputes.find((d) => d.id === selectedId) ?? null

  if (error)
    return (
      <p className="p-12 text-center text-muted-foreground">
        Impossible de charger les données ({error}). Lancez <code>npm run data</code>.
      </p>
    )
  if (!data) return <p className="p-12 text-center text-muted-foreground">Chargement…</p>

  return (
    <div className="min-h-svh">
      <main
        className={cn(
          'mx-auto max-w-5xl px-6 pt-8 pb-12 transition-[margin] duration-300',
          selected && 'lg:mr-[26rem]',
        )}
      >
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest text-muted-foreground uppercase">17ᵉ législature</p>
            <h1 className="text-3xl font-bold tracking-tight">L'hémicycle</h1>
          </div>

          <div className="relative w-full sm:w-80">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Nom, département…"
              aria-label="Rechercher un député"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {q && matches.length > 0 && matches.length <= 8 && (
              <Card className="absolute inset-x-0 top-full z-10 mt-1 gap-0 p-1 shadow-lg">
                {matches.map((d) => (
                  <Button
                    key={d.id}
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => setSelectedId(d.id)}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: groupes.get(d.groupeId ?? '')?.couleur }}
                    />
                    {d.prenom} {d.nom}
                    <span className="truncate text-muted-foreground">· {d.departement}</span>
                  </Button>
                ))}
              </Card>
            )}
          </div>
        </header>

        <Hemicycle
          deputes={data.deputes}
          groupes={groupes}
          selectedId={selectedId}
          isHighlighted={isHighlighted}
          onSelect={(d) => setSelectedId(d.id)}
        />

        <Legend groupes={data.groupes} counts={counts} activeId={groupFilter} onChange={setGroupFilter} />

        <p className="text-center text-xs text-muted-foreground">
          {(q || groupFilter) && <>{matches.length} résultat(s) · </>}
          Données : open data de l'Assemblée nationale, mises à jour le{' '}
          {new Date(data.generatedAt).toLocaleDateString('fr-FR')}. Les sièges sont regroupés par groupe politique.
        </p>
      </main>

      <DeputyPanel
        depute={selected}
        groupe={selected?.groupeId ? groupes.get(selected.groupeId) : undefined}
        baremes={data.baremes}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
