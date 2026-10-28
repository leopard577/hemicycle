import { type ReactNode, useRef, useState } from 'react'
import { XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { alerts } from '@/lib/money'
import type { Office } from '@/lib/offices'
import type { Group, Parliamentarian, PayScales } from '@/types'
import { Alerts } from './panel/Alerts'
import { CostNotes, CostSummary } from './panel/CostSummary'
import { DeclarationsTab } from './panel/DeclarationsTab'
import { InterestsTab } from './panel/InterestsTab'
import { OverlapsNotes, OverlapsTab } from './panel/OverlapsTab'
import { PayNotes, PayTab } from './panel/PayTab'
import { NoteGroup, NotesAndSources } from './panel/parts'

interface Props<T extends Parliamentarian> {
  member: T | null
  group: Group | undefined
  payScales: PayScales
  office: Office
  /** Content of the "Profil" tab, specific to each chamber */
  profile: (m: T) => ReactNode
  onClose: () => void
}

interface DetailsProps {
  member: Parliamentarian
  group: Group | undefined
  payScales: PayScales
  office: Office
  profile: ReactNode
}

const TAB_TRIGGER = 'max-sm:px-1 max-sm:text-[0.8125rem] max-[22.5rem]:px-0.5 max-[22.5rem]:text-xs'

/** Side panel of a member of Parliament: cost, alerts, then tabs */
export function MemberPanel<T extends Parliamentarian>({ member, group, payScales, office, profile, onClose }: Props<T>) {
  return (
    // Non-modal: the hemicycle stays clickable to switch from one member to another
    <Sheet open={member !== null} modal={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[30rem]"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {member && (
          <MemberDetails
            key={member.id}
            member={member}
            group={group}
            payScales={payScales}
            office={office}
            profile={profile(member)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function MemberDetails({ member, group, payScales, office, profile }: DetailsProps) {
  const feminine = member.honorific === 'Mme'
  const body = useRef<HTMLDivElement>(null)
  const tabs = useRef<HTMLDivElement>(null)
  const [notesOpen, setNotesOpen] = useState(false)

  // An asterisk opens "Précisions et sources", then scrolls to its note
  const showNote = (n: number) => {
    setNotesOpen(true)
    window.setTimeout(() => document.getElementById(`note-${n}`)?.scrollIntoView({ block: 'start' }), 50)
  }

  // Switching tabs jumps back to the start of its content when scrolled past the tab bar
  const scrollToTabs = () => {
    const b = body.current
    const t = tabs.current
    if (b && t && b.scrollTop > t.offsetTop) b.scrollTo({ top: t.offsetTop, behavior: 'instant' })
  }

  return (
    <>
      {/* Fixed header: identity and close button stay visible while scrolling */}
      <SheetHeader
        className="relative shrink-0 flex-row items-center gap-3 border-t-4 border-b py-4 pr-14 pl-6 sm:gap-4"
        style={{
          borderTopColor: group?.color,
          background: group && `color-mix(in oklch, ${group.color} 9%, transparent)`,
        }}
      >
        <div className="shrink-0 rounded-full bg-border p-[3px]" style={{ background: group?.color }}>
          <Avatar className="size-14 border-2 border-background sm:size-16">
            <AvatarImage src={member.photo} alt="" className="object-cover" />
            <AvatarFallback className="font-heading text-xl font-bold">
              {member.firstName[0]}
              {member.lastName[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{office.title(feminine)}</p>
          <SheetTitle className="text-xl leading-tight font-semibold sm:text-2xl">
            {member.firstName} {member.lastName}
          </SheetTitle>
          <SheetDescription asChild>
            <div>
              {group ? (
                <Badge variant="outline" className="h-auto bg-background/70 whitespace-normal">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: group.color }} />
                  {group.label} ({group.abbrev})
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

      {/* Only the body scrolls; it is recreated for every member, so it starts from the top */}
      <div
        ref={body}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth motion-reduce:scroll-auto"
      >
        <CostSummary member={member} payScales={payScales} office={office} onNoteRef={showNote} />
        <Alerts alerts={alerts(member, office)} />

        <Tabs ref={tabs} defaultValue="overlaps" onValueChange={scrollToTabs} className="gap-0 px-6 pb-4">
          <div className="sticky top-0 z-10 -mx-6 bg-popover px-6 py-2">
            <TabsList className="w-full group-data-horizontal/tabs:h-9">
              <TabsTrigger value="overlaps" className={TAB_TRIGGER}>
                Cumuls
              </TabsTrigger>
              <TabsTrigger value="pay" className={TAB_TRIGGER}>
                Salaire
              </TabsTrigger>
              <TabsTrigger value="interests" className={TAB_TRIGGER}>
                Intérêts
              </TabsTrigger>
              <TabsTrigger value="declarations" className={TAB_TRIGGER}>
                Déclarations
              </TabsTrigger>
              <TabsTrigger value="profile" className={TAB_TRIGGER}>
                Profil
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overlaps">
            <OverlapsTab member={member} payScales={payScales} office={office} />
          </TabsContent>
          <TabsContent value="profile">{profile}</TabsContent>
          <TabsContent value="pay">
            <PayTab member={member} payScales={payScales} office={office} />
          </TabsContent>
          <TabsContent value="interests">
            <InterestsTab member={member} office={office} />
          </TabsContent>
          <TabsContent value="declarations">
            <DeclarationsTab member={member} office={office} />
          </TabsContent>
        </Tabs>

        <div className="border-t px-6 pb-6">
          <NotesAndSources open={notesOpen} onOpenChange={setNotesOpen}>
            <NoteGroup title="Calcul du coût du siège">
              <CostNotes member={member} payScales={payScales} office={office} />
            </NoteGroup>
            <NoteGroup title="Cumuls et revenus déclarés">
              <OverlapsNotes member={member} payScales={payScales} office={office} />
            </NoteGroup>
            <NoteGroup title="Salaire et frais de mandat">
              <PayNotes member={member} payScales={payScales} office={office} />
            </NoteGroup>
          </NotesAndSources>
        </div>
      </div>
    </>
  )
}
