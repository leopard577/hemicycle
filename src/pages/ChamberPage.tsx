import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Hemicycle } from '@/components/Hemicycle'
import { Legend } from '@/components/Legend'
import { MemberPanel } from '@/components/MemberPanel'
import { ReadingDetail, ReadingPicker } from '@/components/Readings'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatEuro } from '@/lib/format'
import { useLayout } from '@/lib/layout'
import { monthlyCost, summary } from '@/lib/money'
import type { Office } from '@/lib/offices'
import { type Reading, READINGS, tierOf } from '@/lib/readings'
import type { ChamberDataset, Parliamentarian } from '@/types'

const MAX_SUGGESTIONS = 8

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export interface ChamberConfig<T extends Parliamentarian> {
  /** File in public/data/ */
  file: string
  office: Office
  eyebrow: string
  title: string
  /** Constituency line shown when hovering a seat */
  place: (m: T) => ReactNode
  /** Short place shown next to a search suggestion */
  placeLabel: (m: T) => string | null
  /** Extra text matched by the search box (department, code…) */
  searchText: (m: T) => string
  profile: (m: T) => ReactNode
  /** Sources sentence of the footer, before the extraction date */
  sources: string
}

/** A chamber of Parliament: hemicycle, readings, search, group filter and member panel */
export function ChamberPage<T extends Parliamentarian>({ config }: { config: ChamberConfig<T> }) {
  const { office } = config
  const { onPanelChange } = useLayout()
  const [data, setData] = useState<ChamberDataset<T> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [reading, setReading] = useState<Reading>('group')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/${config.file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ChamberDataset<T>>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [config.file])

  const groups = useMemo(() => new Map(data?.groups.map((g) => [g.id, g])), [data])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    data?.members.forEach((d) => d.groupId && m.set(d.groupId, (m.get(d.groupId) ?? 0) + 1))
    return m
  }, [data])

  const summaries = useMemo(() => new Map(data?.members.map((m) => [m.id, summary(m, office)])), [data, office])
  const totalCost = useMemo(
    () => data?.members.reduce((sum, m) => sum + monthlyCost(m, data.payScales).total, 0) ?? 0,
    [data],
  )

  const q = normalize(query.trim())
  const { searchText } = config
  const isHighlighted = useCallback(
    (m: T) => {
      if (groupFilter && m.groupId !== groupFilter) return false
      if (!q) return true
      return normalize(`${m.firstName} ${m.lastName} ${searchText(m)}`).includes(q)
    },
    [groupFilter, q, searchText],
  )

  const matches = useMemo(
    () => (data && (q || groupFilter) ? data.members.filter(isHighlighted) : []),
    [data, q, groupFilter, isHighlighted],
  )

  const selected = data?.members.find((m) => m.id === selectedId) ?? null

  // The layout reserves the panel width while it is open, and frees it when leaving the page
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
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-start justify-between gap-3 px-6 py-3 sm:gap-4 sm:py-5">
          <div>
            <p className="text-xs font-medium tracking-widest text-primary uppercase">{config.eyebrow}</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{config.title}</h1>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-80 sm:flex-none">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Nom, département…"
                aria-label={`Rechercher un ${office.noun}`}
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {q && (
                <Card className="absolute inset-x-0 top-full z-10 mt-1 gap-0 p-1 shadow-lg">
                  {matches.slice(0, MAX_SUGGESTIONS).map((m) => (
                    <Button
                      key={m.id}
                      variant="ghost"
                      className="w-full justify-start font-normal"
                      onClick={() => setSelectedId(m.id)}
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: groups.get(m.groupId ?? '')?.color }}
                      />
                      {m.firstName} {m.lastName}
                      {config.placeLabel(m) && (
                        <span className="truncate text-muted-foreground">· {config.placeLabel(m)}</span>
                      )}
                    </Button>
                  ))}
                  {matches.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Aucun {office.noun} ne correspond.</p>
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
          Chaque mois, ces {data.members.length} sièges coûtent{' '}
          <strong className="font-heading text-2xl text-red-700 tabular-nums dark:text-red-400">
            {formatEuro(totalCost, { compact: true })}
          </strong>{' '}
          aux contribuables, soit {formatEuro(totalCost * 12, { compact: true })} par an. Choisissez un siège pour voir
          ce que chacun touche et cumule.
        </p>

        <ReadingPicker reading={reading} onChange={setReading} />

        <Hemicycle
          members={data.members}
          groups={groups}
          selectedId={selectedId}
          isHighlighted={isHighlighted}
          onSelect={(m) => setSelectedId(m.id)}
          tint={reading === 'group' ? null : (m) => tierOf(reading, summaries.get(m.id)!).fill}
          detail={reading === 'group' ? null : (m) => READINGS[reading].detail(summaries.get(m.id)!)}
          place={config.place}
          label={office.chartLabel}
          countLabel={office.plural}
        />

        {reading !== 'group' && (
          <ReadingDetail
            reading={reading}
            members={data.members}
            summaries={summaries}
            marker={(m) => (
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: groups.get(m.groupId ?? '')?.color }}
              />
            )}
            office={office}
            onSelect={(m) => setSelectedId(m.id)}
          />
        )}

        <Legend groups={data.groups} counts={counts} activeId={groupFilter} onChange={setGroupFilter} />

        <p aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">
          {(q || groupFilter) &&
            `${matches.length} ${matches.length > 1 ? office.plural : office.noun} sur ${data.members.length}`}
        </p>
      </main>

      <SiteFooter>
        {config.sources}, extraites le {new Date(data.generatedAt).toLocaleDateString('fr-FR')}. Revenus et mandats tels
        que déclarés ; les montants de rémunération suivent les barèmes officiels. Les sièges sont regroupés par groupe
        politique.
      </SiteFooter>

      <MemberPanel
        member={selected}
        group={selected?.groupId ? groups.get(selected.groupId) : undefined}
        payScales={data.payScales}
        office={office}
        profile={config.profile}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
