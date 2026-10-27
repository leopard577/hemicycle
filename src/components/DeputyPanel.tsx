import { useRef, useState } from 'react'
import { XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { alertes } from '@/lib/argent'
import type { Baremes, Depute, Groupe } from '@/types'
import { Addition, Calcul } from './deputy/Addition'
import { Alertes } from './deputy/Alertes'
import { CumulsTab, NotesCumuls } from './deputy/CumulsTab'
import { DeclarationsTab } from './deputy/DeclarationsTab'
import { InteretsTab } from './deputy/InteretsTab'
import { ProfilTab } from './deputy/ProfilTab'
import { GroupeNotes, Precisions } from './deputy/parts'
import { NotesRemuneration, RemunerationTab } from './deputy/RemunerationTab'

interface Props {
  depute: Depute | null
  groupe: Groupe | undefined
  baremes: Baremes
  onClose: () => void
}

export function DeputyPanel({ depute, groupe, baremes, onClose }: Props) {
  return (
    // Non modal : l'hémicycle reste cliquable pour passer d'un député à l'autre
    <Sheet open={depute !== null} modal={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[30rem]"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {depute && <DeputyDetails key={depute.id} depute={depute} groupe={groupe} baremes={baremes} />}
      </SheetContent>
    </Sheet>
  )
}

function DeputyDetails({ depute, groupe, baremes }: { depute: Depute; groupe: Groupe | undefined; baremes: Baremes }) {
  const feminine = depute.civ === 'Mme'
  const corps = useRef<HTMLDivElement>(null)
  const onglets = useRef<HTMLDivElement>(null)
  const [sources, setSources] = useState(false)

  // Un astérisque ouvre « Précisions et sources » puis fait défiler jusqu'à sa note
  const versNote = (n: number) => {
    setSources(true)
    window.setTimeout(() => document.getElementById(`calcul-${n}`)?.scrollIntoView({ block: 'start' }), 50)
  }

  // Changer d'onglet ramène au début de son contenu si l'on avait défilé au-delà de la barre d'onglets
  const versOnglets = () => {
    const c = corps.current
    const o = onglets.current
    if (c && o && c.scrollTop > o.offsetTop) c.scrollTo({ top: o.offsetTop, behavior: 'instant' })
  }

  return (
    <>
      {/* En-tête fixe : l'identité et le bouton de fermeture restent visibles pendant le défilement */}
      <SheetHeader
        className="relative shrink-0 flex-row items-center gap-3 border-t-4 border-b py-4 pr-14 pl-6 sm:gap-4"
        style={{
          borderTopColor: groupe?.couleur,
          background: groupe && `color-mix(in oklch, ${groupe.couleur} 9%, transparent)`,
        }}
      >
        <div className="shrink-0 rounded-full bg-border p-[3px]" style={{ background: groupe?.couleur }}>
          <Avatar className="size-14 border-2 border-background sm:size-16">
            <AvatarImage src={depute.photo} alt="" className="object-cover" />
            <AvatarFallback className="font-heading text-xl font-bold">
              {depute.prenom[0]}
              {depute.nom[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{feminine ? 'Députée' : 'Député'}</p>
          <SheetTitle className="text-xl leading-tight font-semibold sm:text-2xl">
            {depute.prenom} {depute.nom}
          </SheetTitle>
          <SheetDescription asChild>
            <div>
              {groupe ? (
                <Badge variant="outline" className="h-auto bg-background/70 whitespace-normal">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: groupe.couleur }} />
                  {groupe.libelle} ({groupe.abrev})
                </Badge>
              ) : (
                'Sans groupe'
              )}
            </div>
          </SheetDescription>
        </div>
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2" aria-label="Fermer la fiche">
            <XIcon />
          </Button>
        </SheetClose>
      </SheetHeader>

      {/* Seul le corps défile ; il est recréé à chaque député, donc repart du haut */}
      <div
        ref={corps}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth motion-reduce:scroll-auto"
      >
        <Addition depute={depute} baremes={baremes} onRenvoi={versNote} />
        <Alertes alertes={alertes(depute)} />

        <Tabs ref={onglets} defaultValue="cumuls" onValueChange={versOnglets} className="gap-0 px-6 pb-4">
          <div className="sticky top-0 z-10 -mx-6 bg-popover px-6 py-2">
            <TabsList className="w-full group-data-horizontal/tabs:h-9">
              <TabsTrigger value="cumuls" className="max-sm:px-1 max-sm:text-[0.8125rem] max-[22.5rem]:px-0.5 max-[22.5rem]:text-xs">
                Cumuls
              </TabsTrigger>
              <TabsTrigger value="remuneration" className="max-sm:px-1 max-sm:text-[0.8125rem] max-[22.5rem]:px-0.5 max-[22.5rem]:text-xs">
                Salaire
              </TabsTrigger>
              <TabsTrigger value="interets" className="max-sm:px-1 max-sm:text-[0.8125rem] max-[22.5rem]:px-0.5 max-[22.5rem]:text-xs">
                Intérêts
              </TabsTrigger>
              <TabsTrigger value="declarations" className="max-sm:px-1 max-sm:text-[0.8125rem] max-[22.5rem]:px-0.5 max-[22.5rem]:text-xs">
                Déclarations
              </TabsTrigger>
              <TabsTrigger value="profil" className="max-sm:px-1 max-sm:text-[0.8125rem] max-[22.5rem]:px-0.5 max-[22.5rem]:text-xs">
                Profil
              </TabsTrigger>
            </TabsList>
          </div>
        <TabsContent value="cumuls">
          <CumulsTab depute={depute} baremes={baremes} />
        </TabsContent>
        <TabsContent value="profil">
          <ProfilTab depute={depute} />
        </TabsContent>
        <TabsContent value="remuneration">
          <RemunerationTab depute={depute} baremes={baremes} />
        </TabsContent>
        <TabsContent value="interets">
          <InteretsTab depute={depute} />
        </TabsContent>
        <TabsContent value="declarations">
          <DeclarationsTab depute={depute} />
        </TabsContent>
        </Tabs>

        <div className="border-t px-6 pb-6">
          <Precisions open={sources} onOpenChange={setSources}>
            <GroupeNotes titre="Calcul du coût du siège">
              <Calcul depute={depute} baremes={baremes} />
            </GroupeNotes>
            <GroupeNotes titre="Cumuls et revenus déclarés">
              <NotesCumuls depute={depute} baremes={baremes} />
            </GroupeNotes>
            <GroupeNotes titre="Salaire et frais de mandat">
              <NotesRemuneration depute={depute} baremes={baremes} />
            </GroupeNotes>
          </Precisions>
        </div>
      </div>
    </>
  )
}
