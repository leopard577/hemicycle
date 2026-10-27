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

const MAX_SUGGESTIONS = 8

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
    // Le panneau ouvert réserve sa largeur en padding : l'hémicycle reste centré dans l'espace libre
    <div
      className={cn('flex min-h-svh flex-col transition-[padding] duration-300', selected && 'lg:pr-[26rem]')}
    >
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-medium tracking-widest text-primary uppercase">Assemblée nationale · 17ᵉ législature</p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight">L'hémicycle</h1>
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
            {q && (
              <Card className="absolute inset-x-0 top-full z-10 mt-1 gap-0 p-1 shadow-lg">
                {matches.slice(0, MAX_SUGGESTIONS).map((d) => (
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
                {matches.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Aucun député ne correspond.</p>
                )}
                {matches.length > MAX_SUGGESTIONS && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    … et {matches.length - MAX_SUGGESTIONS} autres, en surbrillance sur l'hémicycle.
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-8">
        <Hemicycle
          deputes={data.deputes}
          groupes={groupes}
          selectedId={selectedId}
          isHighlighted={isHighlighted}
          onSelect={(d) => setSelectedId(d.id)}
        />

        <Legend groupes={data.groupes} counts={counts} activeId={groupFilter} onChange={setGroupFilter} />

        <p aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">
          {(q || groupFilter) && `${matches.length} député${matches.length > 1 ? 's' : ''} sur ${data.deputes.length}`}
        </p>
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        Données : open data de l'Assemblée nationale, mises à jour le{' '}
        {new Date(data.generatedAt).toLocaleDateString('fr-FR')}. Les sièges sont regroupés par groupe politique.
      </footer>

      <DeputyPanel
        depute={selected}
        groupe={selected?.groupeId ? groupes.get(selected.groupeId) : undefined}
        baremes={data.baremes}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
