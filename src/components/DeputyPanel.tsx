import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { age, formatEuro, formatMonth } from '@/lib/format'
import type { Baremes, Depute, Groupe } from '@/types'
import { DeclarationsTab } from './deputy/DeclarationsTab'
import { InteretsTab } from './deputy/InteretsTab'
import { KeyFigure } from './deputy/parts'
import { ProfilTab } from './deputy/ProfilTab'
import { RemunerationTab } from './deputy/RemunerationTab'

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
        className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[26rem]"
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

  return (
    <>
      <SheetHeader
        className="flex-row items-center gap-4 border-t-4 border-b px-6 pt-8 pb-6"
        style={{
          borderTopColor: groupe?.couleur,
          background: groupe && `color-mix(in oklch, ${groupe.couleur} 9%, transparent)`,
        }}
      >
        <div className="shrink-0 rounded-full bg-border p-[3px]" style={{ background: groupe?.couleur }}>
          <Avatar className="size-22 border-2 border-background">
            <AvatarImage src={depute.photo} alt="" className="object-cover" />
            <AvatarFallback className="font-heading text-2xl font-bold">
              {depute.prenom[0]}
              {depute.nom[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{feminine ? 'Députée' : 'Député'}</p>
          <SheetTitle className="text-2xl leading-tight font-semibold">
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
      </SheetHeader>

      <ChiffresCles depute={depute} baremes={baremes} />

      <Tabs defaultValue="profil" className="gap-0 px-6 pt-2 pb-8">
        <TabsList className="w-full">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="remuneration">Rémunération</TabsTrigger>
          <TabsTrigger value="interets">Intérêts</TabsTrigger>
          <TabsTrigger value="declarations">Déclarations</TabsTrigger>
        </TabsList>
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
    </>
  )
}

/** Ce qui distingue ce député, avant le détail des onglets */
function ChiffresCles({ depute, baremes }: { depute: Depute; baremes: Baremes }) {
  const ans = age(depute.dateNais)
  const participations = depute.hatvp.interets?.participations
  const capital = participations?.reduce((sum, p) => sum + (p.evaluation ?? 0), 0)

  return (
    <dl className="grid grid-cols-2 gap-2 px-6 pt-5 pb-3">
      <KeyFigure
        label="Âge"
        value={ans === null ? '—' : `${ans} ans`}
        hint={depute.villeNais && `${depute.civ === 'Mme' ? 'Née' : 'Né'} à ${depute.villeNais}`}
      />
      <KeyFigure label="En fonction depuis" value={formatMonth(depute.dateDebut)} hint={depute.departement} />
      <KeyFigure
        label="Collaborateurs listés"
        value={depute.nbCollaborateurs}
        hint={`${baremes.maxCollaborateurs} au plus en même temps`}
      />
      <KeyFigure
        label="Capital déclaré"
        value={
          participations === undefined || participations === null
            ? '—'
            : participations.length === 0
              ? 'Néant'
              : formatEuro(capital ?? 0, { compact: true })
        }
        hint={
          participations === undefined
            ? 'Déclaration indisponible'
            : participations === null
              ? 'Rubrique non renseignée'
              : participations.length === 0
                ? 'Aucune participation'
                : `${participations.length} participation${participations.length > 1 ? 's' : ''}`
        }
      />
    </dl>
  )
}
