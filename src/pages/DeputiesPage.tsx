import { useCallback, useEffect, useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { DeputyPanel } from '@/components/DeputyPanel'
import { Hemicycle } from '@/components/Hemicycle'
import { Legend } from '@/components/Legend'
import { ReadingDetail, ReadingPicker } from '@/components/Readings'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatEuro } from '@/lib/format'
import { useLayout } from '@/lib/layout'
import { monthlyCost, summary } from '@/lib/money'
import { type Reading, READINGS, tierOf } from '@/lib/readings'
import type { DeputiesDataset, Deputy } from '@/types'

const MAX_SUGGESTIONS = 8

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** "Députés" page: the Assemblée nationale hemicycle and each deputy's panel */
export function DeputiesPage() {
  const { onPanelChange } = useLayout()
  const [data, setData] = useState<DeputiesDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [reading, setReading] = useState<Reading>('group')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/deputies.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<DeputiesDataset>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  const groups = useMemo(() => new Map(data?.groups.map((g) => [g.id, g])), [data])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    data?.deputies.forEach((d) => d.groupId && m.set(d.groupId, (m.get(d.groupId) ?? 0) + 1))
    return m
  }, [data])

  const summaries = useMemo(() => new Map(data?.deputies.map((d) => [d.id, summary(d)])), [data])
  const totalCost = useMemo(
    () => data?.deputies.reduce((sum, d) => sum + monthlyCost(d, data.payScales).total, 0) ?? 0,
    [data],
  )

  const q = normalize(query.trim())
  const isHighlighted = useCallback(
    (d: Deputy) => {
      if (groupFilter && d.groupId !== groupFilter) return false
      if (!q) return true
      return normalize(`${d.firstName} ${d.lastName} ${d.department ?? ''} ${d.departmentCode ?? ''}`).includes(q)
    },
    [groupFilter, q],
  )

  const matches = useMemo(
    () => (data && (q || groupFilter) ? data.deputies.filter(isHighlighted) : []),
    [data, q, groupFilter, isHighlighted],
  )

  const selected = data?.deputies.find((d) => d.id === selectedId) ?? null

  // The shell reserves the panel width while it is open, and frees it when leaving the page
  useEffect(() => {
    onPanelChange(selected !== null)
    return () => onPanelChange(false)
  }, [selected, onPanelChange])

  if (error)
    return (
      <p className="flex-1 p-12 text-center text-muted-foreground">
        Impossible de charger les données ({error}). Lancez <code>npm run data</code>.
      </p>
    )
  if (!data) return <p className="flex-1 p-12 text-center text-muted-foreground">Chargement…</p>

  return (
    <>
      <div>
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-start justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-medium tracking-widest text-primary uppercase">Assemblée nationale · 17ᵉ législature</p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight">L'hémicycle</h1>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-80 sm:flex-none">
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
                        style={{ background: groups.get(d.groupId ?? '')?.color }}
                      />
                      {d.firstName} {d.lastName}
                      <span className="truncate text-muted-foreground">· {d.department}</span>
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
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-8">
        <p className="mx-auto mb-6 max-w-2xl text-center text-lg text-balance">
          Chaque mois, ces {data.deputies.length} sièges coûtent{' '}
          <strong className="font-heading text-2xl text-red-700 tabular-nums dark:text-red-400">
            {formatEuro(totalCost, { compact: true })}
          </strong>{' '}
          aux contribuables, soit {formatEuro(totalCost * 12, { compact: true })} par an. Choisissez un siège pour voir
          ce que chacun touche et cumule.
        </p>

        <ReadingPicker reading={reading} onChange={setReading} />

        <Hemicycle
          deputies={data.deputies}
          groups={groups}
          selectedId={selectedId}
          isHighlighted={isHighlighted}
          onSelect={(d) => setSelectedId(d.id)}
          tint={reading === 'group' ? null : (d) => tierOf(reading, summaries.get(d.id)!).fill}
          detail={reading === 'group' ? null : (d) => READINGS[reading].detail(summaries.get(d.id)!)}
        />

        {reading !== 'group' && (
          <ReadingDetail
            reading={reading}
            deputies={data.deputies}
            summaries={summaries}
            groups={groups}
            onSelect={(d) => setSelectedId(d.id)}
          />
        )}

        <Legend groups={data.groups} counts={counts} activeId={groupFilter} onChange={setGroupFilter} />

        <p aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">
          {(q || groupFilter) && `${matches.length} député${matches.length > 1 ? 's' : ''} sur ${data.deputies.length}`}
        </p>
      </main>

      <SiteFooter>
        Données publiques : Assemblée nationale, HATVP et Répertoire national des élus (ministère de l'Intérieur),
        extraites le {new Date(data.generatedAt).toLocaleDateString('fr-FR')}. Revenus et mandats tels que déclarés ;
        les montants de rémunération suivent les barèmes officiels. Les sièges sont regroupés par groupe politique.
      </SiteFooter>

      <DeputyPanel
        deputy={selected}
        group={selected?.groupId ? groups.get(selected.groupId) : undefined}
        payScales={data.payScales}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
