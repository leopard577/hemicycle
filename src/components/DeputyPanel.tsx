import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Baremes, Depute, Groupe } from '@/types'
import { DeclarationsTab } from './deputy/DeclarationsTab'
import { InteretsTab } from './deputy/InteretsTab'
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
        className="flex-row items-center gap-4 border-t-[6px] border-b px-6 pt-7 pb-5"
        style={{ borderTopColor: groupe?.couleur }}
      >
        <Avatar className="size-22">
          <AvatarImage src={depute.photo} alt="" className="object-cover" />
          <AvatarFallback className="text-2xl font-bold">
            {depute.prenom[0]}
            {depute.nom[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{feminine ? 'Députée' : 'Député'}</p>
          <SheetTitle className="text-xl leading-tight font-semibold">
            {depute.prenom} {depute.nom}
          </SheetTitle>
          <SheetDescription asChild>
            <div>
              {groupe ? (
                <Badge variant="outline" className="h-auto whitespace-normal">
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

      <Tabs defaultValue="profil" className="gap-0 px-6 pt-4 pb-8">
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
