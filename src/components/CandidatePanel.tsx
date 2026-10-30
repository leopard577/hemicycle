import { XIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { declarationStatus } from '@/lib/declarations'
import { formatDate, formatEuro } from '@/lib/format'
import type { AnnouncedCandidate, CandidateHatvp } from '@/types'
import { DeclaredActivities, Holdings } from './panel/CapitalTab'
import { ExternalLink, KeyFigure, MissingData, Note, NoteGroup, NotesAndSources, Section } from './panel/parts'

const TAB_TRIGGER = 'max-sm:px-1 max-sm:text-[0.8125rem]'

/** Side panel of an announced candidate: the source of the candidacy, then what the HATVP publishes, if anything */
export function CandidatePanel({ candidate, onClose }: { candidate: AnnouncedCandidate | null; onClose: () => void }) {
  return (
    // Non-modal, like the other panels: the cards stay clickable to switch from one candidate to another
    <Sheet open={candidate !== null} modal={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[30rem]"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {candidate && <Details key={candidate.id} candidate={candidate} />}
      </SheetContent>
    </Sheet>
  )
}

/** Initials only: hatvp.fr photos are covered by copyright, and announced candidates have no official portrait */
export function CandidateAvatar({ candidate, className }: { candidate: AnnouncedCandidate; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className="font-heading font-bold">
        {candidate.firstName[0]}
        {candidate.lastName[0]}
      </AvatarFallback>
    </Avatar>
  )
}

function Details({ candidate: c }: { candidate: AnnouncedCandidate }) {
  return (
    <>
      <SheetHeader className="relative shrink-0 flex-row items-center gap-3 border-b py-4 pr-14 pl-6 sm:gap-4">
        <CandidateAvatar candidate={c} className="size-14 text-xl sm:size-16" />
        <div className="min-w-0 space-y-1">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">Candidature annoncée · 2027</p>
          <SheetTitle className="text-xl leading-tight font-semibold sm:text-2xl">
            {c.firstName} {c.lastName}
          </SheetTitle>
          <SheetDescription className="text-sm">{c.party}</SheetDescription>
        </div>
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2" aria-label="Fermer la fiche">
            <XIcon />
          </Button>
        </SheetClose>
      </SheetHeader>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] hover:[scrollbar-color:var(--color-muted-foreground)_transparent] motion-reduce:scroll-auto">
        <div className="px-6 pt-5 pb-3">
          <div className="space-y-2 rounded-xl border border-blue-800/30 bg-blue-800/5 p-4 text-sm dark:border-blue-400/30 dark:bg-blue-400/5">
            <p className="text-xs font-medium tracking-wider text-blue-800 uppercase dark:text-blue-300">
              Sa candidature
            </p>
            <p>
              Rapportée par{' '}
              <ExternalLink href={c.source.url}>
                {c.source.publisher}, {formatDate(c.source.date)}
              </ExternalLink>
              .
            </p>
            <p className="text-muted-foreground">
              Annoncée, pas encore officielle : seule la liste arrêtée par le Conseil constitutionnel, après le dépôt
              des 500 parrainages, en fera foi.
            </p>
          </div>
        </div>

        {c.hatvp ? (
          <HatvpTabs hatvp={c.hatvp} />
        ) : (
          <div className="px-6 py-3">
            <MissingData title="Nous n'avons pas de données">
              La HATVP ne publie aucun dossier à ce nom : elle ne suit que les titulaires de certains mandats et
              fonctions (parlementaires, membres du Gouvernement, élus locaux des plus grandes collectivités…). Ses
              déclarations de candidat ne seront publiées qu'avec la liste officielle.
            </MissingData>
          </div>
        )}

        <div className="border-t px-6 pb-6">
          <NotesAndSources>
            <NoteGroup title="Les candidatures">
              <Note>
                Liste tenue à la main à partir des annonces publiques, chacune avec l'article ou la déclaration qui la
                rapporte ; la date est celle de cette source, l'annonce peut être antérieure.
              </Note>
            </NoteGroup>
            <NoteGroup title="Les déclarations">
              <Note>
                Déclarations d'intérêts déposées à la HATVP au titre d'un mandat ou d'une fonction, reproduites sans
                modification. Chaque candidat remettra aussi au Conseil constitutionnel une déclaration de patrimoine
                et une déclaration d'intérêts, publiées une fois la liste officielle arrêtée, au moins quinze jours
                avant le premier tour (loi n° 62-1292, art. 3). L'application ne reprend jamais le contenu des
                déclarations de patrimoine.
              </Note>
            </NoteGroup>
          </NotesAndSources>
        </div>
      </div>
    </>
  )
}

function HatvpTabs({ hatvp }: { hatvp: CandidateHatvp }) {
  const { interests } = hatvp
  const holdings = interests?.holdings?.length ? interests.holdings : null
  return (
    <>
      <dl className="grid grid-cols-3 gap-2 px-6 pb-3">
        <KeyFigure label="Mandats déclarés" value={hatvp.offices.length} hint="à la HATVP" />
        <KeyFigure
          label="Décl. d'intérêts"
          value={interests ? formatDate(interests.filedAt)?.replace(/ \d{4}$/, '') : '—'}
          hint={interests ? interests.filedAt?.slice(0, 4) : 'non publiée'}
        />
        <KeyFigure
          label="Parts de sociétés"
          value={holdings ? formatEuro(holdings.reduce((sum, h) => sum + (h.value ?? 0), 0), { compact: true }) : '—'}
          hint={holdings ? 'déclarées (calcul)' : 'aucune déclarée'}
        />
      </dl>

      <Tabs defaultValue="offices" className="gap-0 px-6 pb-4">
        <div className="sticky top-0 z-10 -mx-6 bg-popover px-6 py-2">
          <TabsList className="w-full group-data-horizontal/tabs:h-9">
            <TabsTrigger value="offices" className={TAB_TRIGGER}>
              Mandats
            </TabsTrigger>
            <TabsTrigger value="interests" className={TAB_TRIGGER}>
              Activités
            </TabsTrigger>
            <TabsTrigger value="capital" className={TAB_TRIGGER}>
              Capital
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="offices">
          <Offices hatvp={hatvp} />
        </TabsContent>
        <TabsContent value="interests">
          {interests ? (
            <>
              <div className="pt-4">
                <Note>
                  Sa déclaration d'intérêts publiée la plus récente, déposée au titre du mandat « {hatvp.interestsFor}{' '}
                  » : un dépôt plus récent peut ne pas être encore publié.
                </Note>
              </div>
              <DeclaredActivities interests={interests} />
            </>
          ) : (
            <PendingInterests hatvp={hatvp} />
          )}
        </TabsContent>
        <TabsContent value="capital">
          {interests ? (
            <Section title="Parts détenues dans des sociétés">
              <Note>
                Listées dans sa déclaration d'intérêts du {formatDate(interests.filedAt)}, aux valeurs déclarées. Les
                biens immobiliers et l'épargne relèvent de la déclaration de patrimoine, que l'application ne reprend
                pas.
              </Note>
              <Holdings items={interests.holdings} />
            </Section>
          ) : (
            <PendingInterests hatvp={hatvp} />
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

function Offices({ hatvp }: { hatvp: CandidateHatvp }) {
  return (
    <div className="divide-y">
      <Section title="Mandats et fonctions" aside={<ExternalLink href={hatvp.page}>Dossier sur hatvp.fr</ExternalLink>}>
        <ul className="space-y-2 text-sm">
          {hatvp.offices.map((o) => (
            <li key={`${o.type}-${o.role}`} className="space-y-0.5">
              <div className="font-medium">{o.role ?? o.institution}</div>
              <div className="text-xs text-muted-foreground">
                {o.institution}
                {o.lastFiledAt && ` · dernier dépôt le ${formatDate(o.lastFiledAt)}`}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Déclarations d'intérêts déposées">
        {hatvp.declarations.length ? (
          <ul className="space-y-2 text-sm">
            {hatvp.declarations.map((d, i) => {
              const { label, status } = declarationStatus(d)
              return (
                <li key={i} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block">{d.institution}</span>
                    <span className="block text-xs text-muted-foreground">
                      {d.filedAt ? `Déposée le ${formatDate(d.filedAt)}` : 'Date de dépôt non publiée'}
                    </span>
                  </span>
                  <Badge variant={status === 'published' ? 'secondary' : 'outline'} className="shrink-0">
                    {label}
                  </Badge>
                </li>
              )
            })}
          </ul>
        ) : (
          <Note>Aucune déclaration d'intérêts dans ce dossier.</Note>
        )}
      </Section>
    </div>
  )
}

/** A file but no published declaration of interests: says why, from the latest filing */
function PendingInterests({ hatvp }: { hatvp: CandidateHatvp }) {
  const latest = hatvp.declarations[0]
  const { label, status } = latest ? declarationStatus(latest) : { label: '', status: 'missing' as const }
  return (
    <div className="py-4">
      <MissingData title="Pas encore de déclaration d'intérêts publiée">
        {!latest
          ? "Le dossier HATVP ne comporte aucune déclaration d'intérêts."
          : status === 'published'
            ? "Sa déclaration est publiée sur hatvp.fr, mais son contenu ne figure pas dans les fichiers open data de la HATVP."
            : `Dernière déclaration d'intérêts (${latest.institution})${latest.filedAt ? `, déposée le ${formatDate(latest.filedAt)}` : ''} : ${label.charAt(0).toLowerCase()}${label.slice(1)}.`}
      </MissingData>
    </div>
  )
}
