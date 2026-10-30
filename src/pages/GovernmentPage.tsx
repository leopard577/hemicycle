import { useEffect, useMemo, useState } from 'react'
import { CouncilTable } from '@/components/CouncilTable'
import { CabinetsCard, ElyseeCard, MinistriesCard } from '@/components/GovernmentCosts'
import { GovernmentPanel } from '@/components/GovernmentPanel'
import { PageError, PageLoading } from '@/components/PageStatus'
import { ExternalLink } from '@/components/panel/parts'
import { ReadingDetail, ReadingPicker } from '@/components/Readings'
import { SiteFooter } from '@/components/SiteFooter'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate, formatEuro } from '@/lib/format'
import { RANKS, rankLabel, rankStyle, roleUnder } from '@/lib/government'
import { useLayout } from '@/lib/layout'
import { summary } from '@/lib/money'
import { GOVERNMENT_MEMBER, PRESIDENT } from '@/lib/offices'
import { type Reading, READINGS, tierOf } from '@/lib/readings'
import { cn } from '@/lib/utils'
import type { GovernmentDataset, GovernmentMember } from '@/types'

/** "Gouvernement" page: the President, the Prime Minister and the ministers, with what their pay costs */
export function GovernmentPage() {
  const { onPanelChange } = useLayout()
  const [data, setData] = useState<GovernmentDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reading, setReading] = useState<Reading>('group')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/government.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<GovernmentDataset>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  const selected = data?.members.find((m) => m.id === selectedId) ?? null

  // The layout reserves the panel width while it is open, and frees it when leaving the page
  useEffect(() => {
    onPanelChange(selected !== null)
    return () => onPanelChange(false)
  }, [selected, onPanelChange])

  // Same indicators as the chamber pages; the President's declarations follow his own office's rules
  const summaries = useMemo(
    () => new Map(data?.members.map((m) => [m.id, summary(m, m.rank === 'president' ? PRESIDENT : GOVERNMENT_MEMBER)])),
    [data],
  )

  const totalCost = useMemo(
    () => data?.members.reduce((sum, m) => sum + data.payScales.ranks[m.rank].gross, 0) ?? 0,
    [data],
  )

  if (error) return <PageError error={error} />
  if (!data) return <PageLoading />

  const { members } = data
  const ministers = members.filter((m) => m.rank !== 'president').length
  const delegatesOf = (head: GovernmentMember) => members.filter((m) => m.reportsTo.includes(head.id))
  const select = (m: GovernmentMember) => setSelectedId(m.id)

  return (
    <>
      <div>
        <div className="mx-auto w-full max-w-5xl px-6 py-3 sm:py-5">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            Exécutif
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Le Président et le Gouvernement</h1>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-6 py-4">
        <section className="space-y-6">
          <p className="mx-auto max-w-2xl text-center text-lg text-balance">
            Chaque mois, la rémunération du Président de la République et des {ministers} membres du Gouvernement coûte{' '}
            <strong className="font-heading text-2xl text-red-700 tabular-nums dark:text-red-400">
              {formatEuro(totalCost, { round: true })}
            </strong>{' '}
            bruts, soit {formatEuro(totalCost * 12, { compact: true })} par an. S'y ajoutent{' '}
            {(data.cabinets.totals.members + data.cabinets.totals.support).toLocaleString('fr-FR')} personnes dans les
            cabinets et un budget de {formatEuro(data.elysee.spendingTotal, { compact: true })} pour l'Élysée (voir plus
            bas). Choisissez une place pour voir ce que chacun touche et déclare.
          </p>

          <div>
            <ReadingPicker reading={reading} onChange={setReading} baseLabel="Rangs" label="Colorer la table selon" />
            <CouncilTable
              members={members}
              payScales={data.payScales}
              selectedId={selectedId}
              onSelect={select}
              tint={reading === 'group' ? null : (m) => tierOf(reading, summaries.get(m.id)!).fill}
              detail={reading === 'group' ? null : (m) => READINGS[reading].detail(summaries.get(m.id)!)}
            />
          </div>

          {reading !== 'group' ? (
            <ReadingDetail
              reading={reading}
              members={members}
              summaries={summaries}
              office={GOVERNMENT_MEMBER}
              onSelect={select}
              marker={(m) => <RankDot rank={m.rank} />}
            />
          ) : (
            <>
              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                {RANKS.map(({ rank, label }) => {
                  const count = members.filter((m) => m.rank === rank).length
                  if (!count) return null
                  return (
                    <li key={rank} className="flex items-center gap-2">
                      <RankDot rank={rank} />
                      <span className="font-medium">{label}</span>
                      {count > 1 && <span className="text-muted-foreground tabular-nums">{count}</span>}
                      <span className="text-muted-foreground tabular-nums">
                        ·{' '}
                        {formatEuro(data.payScales.ranks[rank].gross, {
                          round: true,
                        })}
                        /mois
                      </span>
                    </li>
                  )
                })}
              </ul>

              <p className="mx-auto max-w-2xl text-center text-xs text-balance text-muted-foreground">
                Disposition inspirée du Conseil des ministres : le Président et le Premier ministre se font face, les
                autres membres s'assoient de part et d'autre dans l'ordre du décret de composition, du plus haut rang au
                plus bas. Survolez un ministre pour voir ses ministres délégués.
              </p>
            </>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-semibold">Qui travaille avec qui</h2>
            <p className="text-sm text-muted-foreground">
              Chaque ministre délégué est placé « auprès » du Premier ministre ou d'un ministre, dont il partage
              l'administration.
            </p>
          </div>

          {/* The President is not a member of the Government: on his own row, above the Prime Minister's team */}
          {members
            .filter((m) => m.rank === 'president')
            .map((head) => (
              <Ministry
                key={head.id}
                head={head}
                delegates={[]}
                selectedId={selectedId}
                onSelect={select}
                className="border-blue-800/40 sm:mx-auto sm:max-w-sm dark:border-blue-400/40"
              />
            ))}

          {/* Columns rather than a grid: cards of very different heights stack without leaving gaps */}
          <div className="gap-3 sm:columns-2 lg:columns-3">
            {members
              .filter((m) => m.rank === 'pm' || m.rank === 'minister')
              .map((head) => (
                <Ministry
                  key={head.id}
                  head={head}
                  delegates={delegatesOf(head)}
                  selectedId={selectedId}
                  onSelect={select}
                  className={cn(
                    'mb-3 break-inside-avoid',
                    head.rank === 'pm' && 'border-red-600/40 dark:border-red-400/40',
                  )}
                />
              ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-semibold">Les cabinets et l'Élysée</h2>
            <p className="text-sm text-muted-foreground">
              Ce que le Gouvernement et la Présidence mobilisent au-delà de la rémunération de leurs membres, d'après
              les annexes au projet de loi de finances.
            </p>
          </div>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <CabinetsCard cabinets={data.cabinets} members={members} selectedId={selectedId} onSelect={select} />
            <div className="space-y-4">
              <ElyseeCard elysee={data.elysee} />
              <MinistriesCard budgets={data.ministryBudgets} members={members} onSelect={select} />
            </div>
          </div>
        </section>

        {data.departures.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold">Ont quitté le Gouvernement</h2>
            <ul className="divide-y rounded-lg border text-sm">
              {data.departures.map((d) => (
                <li key={d.lastName + d.firstName} className="space-y-0.5 px-3 py-2.5">
                  <div className="font-medium">
                    {d.firstName} {d.lastName}
                  </div>
                  <div className="text-muted-foreground">{d.role}</div>
                  <div className="text-xs text-muted-foreground">
                    Du {formatDate(d.startDate)} au {formatDate(d.endedBy.date)} ·{' '}
                    <ExternalLink href={d.endedBy.url}>{d.endedBy.title}</ExternalLink>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter>
        Données publiques : Journal officiel (décrets de nomination), Conseil constitutionnel, HATVP et Répertoire
        national des élus (ministère de l'Intérieur), extraites le{' '}
        {new Date(data.generatedAt).toLocaleDateString('fr-FR')}. Rémunérations calculées selon le décret n° 2012-983.
      </SiteFooter>

      <GovernmentPanel
        member={selected}
        payScales={data.payScales}
        cabinetsAsOf={data.cabinets.asOf}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}

/** Legend disc of a rank, as drawn on the table */
function RankDot({ rank }: { rank: GovernmentMember['rank'] }) {
  return (
    <svg viewBox="0 0 10 10" className="size-3 shrink-0" aria-hidden>
      <circle cx={5} cy={5} r={4} className={cn('stroke-[1.5]', rankStyle(rank).seat)} />
    </svg>
  )
}

/** The President, the Prime Minister or a minister, with the ministers delegate placed with them */
function Ministry({
  head,
  delegates,
  selectedId,
  onSelect,
  className,
}: {
  head: GovernmentMember
  delegates: GovernmentMember[]
  selectedId: string | null
  onSelect: (m: GovernmentMember) => void
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <PersonButton member={head} title={head.role} selected={head.id === selectedId} onSelect={onSelect} />
      {delegates.length > 0 && (
        <ul className="mx-3 mb-3 space-y-1 border-l-2 border-dashed pl-2">
          {delegates.map((d) => (
            <li key={d.id}>
              <PersonButton
                member={d}
                title={roleUnder(d, head)}
                selected={d.id === selectedId}
                onSelect={onSelect}
                small
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PersonButton({
  member,
  title,
  selected,
  onSelect,
  small = false,
}: {
  member: GovernmentMember
  title: string
  selected: boolean
  onSelect: (m: GovernmentMember) => void
  small?: boolean
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => onSelect(member)}
      aria-pressed={selected}
      aria-label={`${member.firstName} ${member.lastName}, ${member.role}`}
      className={cn(
        'h-auto w-full items-start justify-start gap-3 text-left font-normal whitespace-normal',
        small ? 'p-2' : 'p-3',
        selected && 'bg-accent ring-1 ring-foreground',
      )}
    >
      <Avatar className={cn('shrink-0', small ? 'size-8' : 'size-10')}>
        <AvatarImage src={member.photo} alt="" className="object-cover" />
        <AvatarFallback className="font-heading text-xs font-bold">
          {member.firstName[0]}
          {member.lastName[0]}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 space-y-0.5">
        {member.rank !== 'minister' && (
          <span className="block text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
            {rankLabel(member)}
          </span>
        )}
        <span className={cn('block font-medium', small && 'text-sm')}>
          {member.firstName} {member.lastName}
        </span>
        {member.rank !== 'president' && member.rank !== 'pm' && (
          // No `block` here: it would override the -webkit-box display that `line-clamp-2` needs
          <span title={title} className="line-clamp-2 text-xs text-muted-foreground">
            {title}
          </span>
        )}
      </span>
    </Button>
  )
}
