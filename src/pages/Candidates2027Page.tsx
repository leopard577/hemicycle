import { useCallback, useEffect, useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { CandidatePanel } from '@/components/CandidatePanel'
import { Hemicycle } from '@/components/Hemicycle'
import { Legend } from '@/components/Legend'
import { PageError, PageLoading } from '@/components/PageStatus'
import { ExternalLink } from '@/components/panel/parts'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CAPITAL_TIERS, capitalOf, capitalTierOf, HATVP_TIERS, tierOf } from '@/lib/candidates'
import { formatDate, formatEuro } from '@/lib/format'
import { useLayout } from '@/lib/layout'
import { useSelectedId } from '@/lib/selection'
import { cn } from '@/lib/utils'
import type { AnnouncedCandidate, Candidates2027Dataset } from '@/types'

const MAX_SUGGESTIONS = 8
const UNPLACED_COLOR = '#8D949A'

type Reading = 'family' | 'hatvp' | 'capital'

interface TieredReading {
  tiers: Record<string, { label: string; fill: string; dot: string }>
  of: (c: AnnouncedCandidate) => string
  ariaLabel: string
}

// Readings that colour each seat by tier rather than by political family
const TIERED: Record<Exclude<Reading, 'family'>, TieredReading> = {
  hatvp: { tiers: HATVP_TIERS, of: tierOf, ariaLabel: 'Filtrer selon les données HATVP' },
  capital: { tiers: CAPITAL_TIERS, of: capitalTierOf, ariaLabel: 'Filtrer selon le capital déclaré' },
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const byLastName = (a: AnnouncedCandidate, b: AnnouncedCandidate) =>
  a.lastName.localeCompare(b.lastName, 'fr') || a.firstName.localeCompare(b.firstName, 'fr')

/** "Jean-Luc" → "J.-L." */
const initials = (firstName: string) =>
  firstName
    .split('-')
    .map((part) => `${part[0]}.`)
    .join('-')

/** A candidate on a seat: their political family stands for the parliamentary group */
type Seated = AnnouncedCandidate & { groupId: string | null }

/**
 * "Candidats (2027)" page: candidacies announced before the official list, on a hemicycle from left to right by
 * political family (or coloured by what the HATVP publishes), the others listed apart; each opens a side panel
 */
export function Candidates2027Page() {
  const { onPanelChange } = useLayout()
  const [data, setData] = useState<Candidates2027Dataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useSelectedId()
  const [query, setQuery] = useState('')
  const [reading, setReading] = useState<Reading>('family')
  // Family id or tier, depending on the reading
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/candidates-2027.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Candidates2027Dataset>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  const families = useMemo(() => new Map(data?.families.map((f) => [f.id, f])), [data])
  const seated = useMemo<Seated[]>(
    () => data?.candidates.filter((c) => c.familyId).map((c) => ({ ...c, groupId: c.familyId })) ?? [],
    [data],
  )
  const unplaced = useMemo(() => data?.candidates.filter((c) => !c.familyId).sort(byLastName) ?? [], [data])
  const familyCounts = useMemo(() => {
    const m = new Map<string, number>()
    seated.forEach((c) => m.set(c.familyId!, (m.get(c.familyId!) ?? 0) + 1))
    return m
  }, [seated])
  const tiered = reading === 'family' ? null : TIERED[reading]
  const tierCounts = useMemo(() => {
    const m = new Map<string, number>()
    if (tiered) data?.candidates.forEach((c) => m.set(tiered.of(c), (m.get(tiered.of(c)) ?? 0) + 1))
    return m
  }, [data, tiered])

  const q = normalize(query.trim())
  const isHighlighted = useCallback(
    (c: AnnouncedCandidate) => {
      if (filter && (tiered ? tiered.of(c) : c.familyId) !== filter) return false
      return !q || normalize(`${c.firstName} ${c.lastName} ${c.party}`).includes(q)
    },
    [filter, tiered, q],
  )
  const matches = useMemo(
    () => (data && (q || filter) ? data.candidates.filter(isHighlighted).sort(byLastName) : []),
    [data, q, filter, isHighlighted],
  )

  const selected = data?.candidates.find((c) => c.id === selectedId) ?? null

  // The layout reserves the panel width while it is open, and frees it when leaving the page
  useEffect(() => {
    onPanelChange(selected !== null)
    return () => onPanelChange(false)
  }, [selected, onPanelChange])

  if (error) return <PageError error={error} />
  if (!data) return <PageLoading />

  const { election } = data
  const total = data.candidates.length
  const withFile = data.candidates.filter((c) => c.hatvp).length
  const select = (c: AnnouncedCandidate) => setSelectedId(c.id)
  const marker = (c: AnnouncedCandidate) =>
    tiered ? (
      <span className={cn('size-2.5 shrink-0 rounded-full', tiered.tiers[tiered.of(c)].dot)} />
    ) : (
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: (c.familyId && families.get(c.familyId)?.color) || UNPLACED_COLOR }}
      />
    )

  return (
    <>
      <div>
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-start justify-between gap-3 px-6 py-3 sm:gap-4 sm:py-5">
          <div>
            <p className="text-xs font-medium tracking-widest text-primary uppercase">Candidats (2027)</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{election.label}</h1>
          </div>
          <div className="relative w-full sm:w-80">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Nom, parti…"
              aria-label="Rechercher une candidature"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {q && (
              <Card className="absolute inset-x-0 top-full z-10 mt-1 gap-0 p-1 shadow-lg">
                {matches.slice(0, MAX_SUGGESTIONS).map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => select(c)}
                  >
                    {marker(c)}
                    {c.firstName} {c.lastName}
                    <span className="truncate text-muted-foreground">· {c.party}</span>
                  </Button>
                ))}
                {matches.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Aucune candidature ne correspond.</p>
                )}
                {matches.length > MAX_SUGGESTIONS && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    … et {matches.length - MAX_SUGGESTIONS} autres, en surbrillance.
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-4">
        <p className="mx-auto mb-6 max-w-2xl text-center text-lg text-balance">
          <strong className="font-heading text-2xl text-blue-800 tabular-nums dark:text-blue-300">{total}</strong>{' '}
          candidatures annoncées à l'élection présidentielle. La HATVP publie déjà des données sur{' '}
          <strong className="font-heading text-2xl text-blue-800 tabular-nums dark:text-blue-300">{withFile}</strong>{' '}
          d'entre elles, au titre d'un mandat ou d'une fonction. Choisissez un siège pour voir ce qu'elle publie.
        </p>

        <ToggleGroup
          type="single"
          variant="outline"
          value={reading}
          onValueChange={(v) => {
            if (!v) return
            setReading(v as Reading)
            setFilter(null)
          }}
          aria-label="Colorer l'hémicycle selon"
          className="mx-auto mb-6 flex-wrap justify-center"
        >
          <ToggleGroupItem value="family">Familles politiques</ToggleGroupItem>
          <ToggleGroupItem value="hatvp">Données HATVP</ToggleGroupItem>
          <ToggleGroupItem value="capital">Capital déclaré</ToggleGroupItem>
        </ToggleGroup>

        <div className="mx-auto w-full max-w-3xl">
          <Hemicycle
            members={seated}
            groups={families}
            selectedId={selectedId}
            isHighlighted={isHighlighted}
            onSelect={select}
            tint={tiered ? (c) => tiered.tiers[tiered.of(c)].fill : null}
            detail={
              reading === 'capital'
                ? (c) => {
                    const v = capitalOf(c)
                    return v ? formatEuro(v, { compact: true }) : CAPITAL_TIERS[capitalTierOf(c)].label
                  }
                : tiered
                  ? (c) => tiered.tiers[tiered.of(c)].label
                  : null
            }
            place={(c) => c.party}
            label="Candidatures annoncées, de la gauche à la droite"
            countLabel="placées de la gauche à la droite"
            rows={1}
            seatLabel={{ compact: (c) => c.lastName, full: (c) => `${initials(c.firstName)} ${c.lastName}` }}
          />
          <div aria-hidden className="flex justify-between px-1 pt-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            <span>← Gauche</span>
            <span>Droite →</span>
          </div>
        </div>

        {!tiered ? (
          <Legend groups={data.families} counts={familyCounts} activeId={filter} onChange={setFilter} />
        ) : (
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={filter ?? ''}
            onValueChange={(v) => setFilter(v || null)}
            aria-label={tiered.ariaLabel}
            className="mx-auto mt-8 mb-4 w-full flex-wrap justify-center"
          >
            {Object.entries(tiered.tiers).map(([t, tier]) => (
              <ToggleGroupItem key={t} value={t} className="rounded-full data-[state=on]:border-foreground">
                <span className={cn('size-2.5 shrink-0 rounded-full', tier.dot)} />
                <span className="font-semibold">{tier.label}</span>
                <span className="text-muted-foreground tabular-nums">{tierCounts.get(t) ?? 0}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        {reading === 'capital' && (
          <p className="mx-auto mb-2 max-w-xl text-center text-xs text-balance text-muted-foreground">
            Somme calculée par le site des valeurs déclarées pour les parts de sociétés, dans la déclaration d'intérêts
            la plus récente publiée par la HATVP. Les montants non publiés n'y sont pas comptés ; l'immobilier et
            l'épargne relèvent de la déclaration de patrimoine, que le site ne reprend pas.
          </p>
        )}
        <p className="mx-auto max-w-xl text-center text-xs text-balance text-muted-foreground">
          Placement indicatif, établi par le site d'après le parti ou le mouvement de chaque candidature, sur le modèle
          des nuances politiques du ministère de l'Intérieur.
        </p>

        {unplaced.length > 0 && (
          <section className="mx-auto mt-10 w-full max-w-3xl space-y-3">
            <div className="space-y-1 text-center">
              <h2 className="font-heading text-xl font-semibold">
                Hors de l'axe gauche-droite{' '}
                <span className="text-muted-foreground tabular-nums">{unplaced.length}</span>
              </h2>
              <p className="text-sm text-balance text-muted-foreground">
                Sans parti, ou avec un mouvement qu'aucune famille politique établie ne recouvre : nous ne les plaçons
                pas.
              </p>
            </div>
            <ul className="flex flex-wrap justify-center gap-1.5">
              {unplaced.map((c) => (
                <li key={c.id}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => select(c)}
                    aria-pressed={c.id === selectedId}
                    aria-label={`${c.firstName} ${c.lastName}, ${c.party}`}
                    className={cn(
                      'rounded-full font-normal transition-opacity duration-200',
                      !isHighlighted(c) && 'opacity-25',
                      c.id === selectedId && 'border-foreground bg-accent',
                    )}
                  >
                    {marker(c)}
                    {c.firstName} {c.lastName}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p aria-live="polite" className="mt-6 min-h-5 text-center text-sm text-muted-foreground">
          {(q || filter) && `${matches.length} candidature${matches.length > 1 ? 's' : ''} sur ${total}`}
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-balance text-muted-foreground">
          Annoncées, pas encore officielles : seule la liste du Conseil constitutionnel, après le dépôt des 500
          parrainages, fera foi. Chaque candidature est sourcée ; liste vérifiée le {formatDate(election.checkedAt)} à
          partir de <ExternalLink href={election.compiledFrom.url}>{election.compiledFrom.label}</ExternalLink>.
        </p>
      </main>

      <SiteFooter>
        Candidatures : articles et déclarations cités pour chacune. Familles politiques : placement par le site.
        Dossiers et déclarations d'intérêts : open data de la HATVP, extraite le{' '}
        {new Date(data.generatedAt).toLocaleDateString('fr-FR')}.
      </SiteFooter>

      <CandidatePanel candidate={selected} onClose={() => setSelectedId(null)} />
    </>
  )
}
