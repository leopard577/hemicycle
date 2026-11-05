import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Hemicycle } from '@/components/Hemicycle'
import { Legend } from '@/components/Legend'
import { MemberPanel } from '@/components/MemberPanel'
import { PageError, PageLoading } from '@/components/PageStatus'
import { ReadingDetail, ReadingPicker } from '@/components/Readings'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatEuro } from '@/lib/format'
import { useLayout } from '@/lib/layout'
import { monthlyCost, summary } from '@/lib/money'
import type { Office } from '@/lib/offices'
import { ACTIVITY_READINGS, type Reading, READINGS, tierOf } from '@/lib/readings'
import { useSelectedId } from '@/lib/selection'
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
  const [selectedId, setSelectedId] = useSelectedId()
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [reading, setReading] = useState<Reading>('group')
  // Label of the tier filtering the seats, within the active reading
  const [tierFilter, setTierFilter] = useState<string | null>(null)

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
      if (tierFilter && reading !== 'group' && tierOf(reading, summaries.get(m.id)!).label !== tierFilter) return false
      if (!q) return true
      return normalize(`${m.firstName} ${m.lastName} ${searchText(m)}`).includes(q)
    },
    [groupFilter, tierFilter, reading, summaries, q, searchText],
  )

  // A finger aims at what stands out: seats left out by a filter, then the grey ones when coloured seats are the
  // minority. With most seats coloured, grey ones are looked for too and must stay reachable.
  const isTarget = useMemo(() => {
    if (reading === 'group' || tierFilter || !data) return isHighlighted
    const { value } = READINGS[reading]
    const coloured = (m: T) => value(summaries.get(m.id)!) > 0
    return data.members.filter(coloured).length < data.members.length / 2
      ? (m: T) => isHighlighted(m) && coloured(m)
      : isHighlighted
  }, [data, reading, tierFilter, summaries, isHighlighted])

  const matches = useMemo(
    () => (data && (q || groupFilter || tierFilter) ? data.members.filter(isHighlighted) : []),
    [data, q, groupFilter, tierFilter, isHighlighted],
  )

  const selected = data?.members.find((m) => m.id === selectedId) ?? null

  // The layout reserves the panel width while it is open, and frees it when leaving the page
  useEffect(() => {
    onPanelChange(selected !== null)
    return () => onPanelChange(false)
  }, [selected, onPanelChange])

  if (error) return <PageError error={error} />
  if (!data) return <PageLoading />

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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-4">
        <p className="mx-auto mb-6 max-w-2xl text-center text-lg text-balance">
          Chaque mois, ces {data.members.length} sièges coûtent{' '}
          <strong className="font-heading text-2xl text-red-700 tabular-nums dark:text-red-400">
            {formatEuro(totalCost, { compact: true })}
          </strong>{' '}
          aux contribuables, soit {formatEuro(totalCost * 12, { compact: true })} par an. Choisissez un siège pour voir
          ce que chacun touche et cumule.
        </p>

        <ReadingPicker
          reading={reading}
          onChange={(r) => {
            setReading(r)
            setTierFilter(null)
          }}
          omit={data.members.some((m) => m.activity) ? [] : ACTIVITY_READINGS}
        />

        {/* On a phone the chart takes most of the side gutters: every pixel of width makes the seats easier to reach */}
        <div className="-mx-4 sm:mx-0">
          <Hemicycle
            members={data.members}
            groups={groups}
            selectedId={selectedId}
            isHighlighted={isHighlighted}
            isTarget={isTarget}
            onSelect={(m) => setSelectedId(m.id)}
            tint={reading === 'group' ? null : (m) => tierOf(reading, summaries.get(m.id)!).fill}
            detail={reading === 'group' ? null : (m) => READINGS[reading].detail(summaries.get(m.id)!)}
            place={config.place}
            label={office.chartLabel}
            countLabel={office.plural}
          />
        </div>

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
            activeTier={tierFilter}
            onTierChange={setTierFilter}
          />
        )}

        <Legend groups={data.groups} counts={counts} activeId={groupFilter} onChange={setGroupFilter} />
        {/* Seats are drawn group by group, not where each member really sits: the official seat is in the panel */}
        <p className="mx-auto max-w-xl text-center text-xs text-balance text-muted-foreground">
          Représentation indicative. La place réelle figure dans la fiche, onglet « Profil ».
        </p>

        <p aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">
          {(q || groupFilter || tierFilter) &&
            `${matches.length} ${matches.length > 1 ? office.plural : office.noun} sur ${data.members.length}`}
        </p>
      </main>

      <SiteFooter>
        {config.sources}, extraites le {new Date(data.generatedAt).toLocaleDateString('fr-FR')}. Revenus et mandats tels
        que déclarés ; les montants de rémunération suivent les barèmes officiels. Les sièges sont regroupés par groupe
        politique. Décisions de justice : Casier Politique, CC BY-NC-SA 4.0.
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
