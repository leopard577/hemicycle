import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { age, formatDate, formatEuro } from '@/lib/format'
import { presidentialTerm, rankLabel } from '@/lib/government'
import { alerts } from '@/lib/money'
import { GOVERNMENT_MEMBER, PRESIDENT } from '@/lib/offices'
import { cn } from '@/lib/utils'
import type { GovernmentMember, GovernmentPayScales } from '@/types'
import { Alerts } from './panel/Alerts'
import { LiveCounter } from './panel/CostSummary'
import { DeclarationsTab } from './panel/DeclarationsTab'
import { CapitalTab } from './panel/CapitalTab'
import { OverlapsNotes, OverlapsTab } from './panel/OverlapsTab'
import { ExternalLink, Field, Fields, Note, NoteGroup, NotesAndSources, Section } from './panel/parts'

const TAB_TRIGGER = 'max-sm:px-1 max-sm:text-[0.8125rem]'

interface Props {
  member: GovernmentMember | null
  payScales: GovernmentPayScales
  onClose: () => void
}

/** Side panel of the President or a member of the Government: pay, alerts, then tabs */
export function GovernmentPanel({ member, payScales, onClose }: Props) {
  return (
    // Non-modal, like the chamber panel: the cards stay clickable to switch from one member to another
    <Sheet open={member !== null} modal={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[30rem]"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {member && <Details key={member.id} member={member} payScales={payScales} />}
      </SheetContent>
    </Sheet>
  )
}

function Details({ member, payScales }: { member: GovernmentMember; payScales: GovernmentPayScales }) {
  const office = member.rank === 'president' ? PRESIDENT : GOVERNMENT_MEMBER
  const [notesOpen, setNotesOpen] = useState(false)
  const pay = payScales.ranks[member.rank]
  const yearly = pay.gross * 12

  return (
    <>
      <SheetHeader className="relative shrink-0 flex-row items-center gap-3 border-b py-4 pr-14 pl-6 sm:gap-4">
        <Avatar className="size-14 sm:size-16">
          <AvatarImage src={member.photo} alt="" className="object-cover" />
          <AvatarFallback className="font-heading text-xl font-bold">
            {member.firstName[0]}
            {member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{rankLabel(member)}</p>
          <SheetTitle className="text-xl leading-tight font-semibold sm:text-2xl">
            {member.firstName} {member.lastName}
          </SheetTitle>
          {/* Kept for screen readers when it only repeats the rank ("Premier ministre") */}
          <SheetDescription className={cn('text-sm', member.role === rankLabel(member) && 'sr-only')}>
            {member.role}
          </SheetDescription>
        </div>
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2" aria-label="Fermer la fiche">
            <XIcon />
          </Button>
        </SheetClose>
      </SheetHeader>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] hover:[scrollbar-color:var(--color-muted-foreground)_transparent] motion-reduce:scroll-auto">
        <div className="px-6 pt-5 pb-3">
          <div className="space-y-3 rounded-xl border border-red-600/30 bg-red-600/5 p-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-red-700 uppercase dark:text-red-400">
                Cette fonction coûte aux contribuables
              </p>
              <p className="font-heading text-4xl leading-tight font-bold tabular-nums">
                {formatEuro(pay.gross, { round: true })}
                <span className="text-base font-medium text-muted-foreground"> / mois</span>
              </p>
              <p className="text-sm text-muted-foreground">
                soit <strong className="text-foreground">{formatEuro(yearly, { round: true })} par an</strong>,
                l'équivalent de{' '}
                <strong className="text-foreground">
                  {(yearly / (payScales.minimumWage.gross * 12)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}{' '}
                  années
                </strong>{' '}
                de SMIC brut. Rémunération seule : le cabinet n'est pas compté.
              </p>
            </div>
            <Fields>
              <Field label="Traitement">{formatEuro(pay.salary)}</Field>
              <Field label="Indemnité de résidence">{formatEuro(pay.residence)}</Field>
              <Field label="Indemnité de fonction">{formatEuro(pay.office)}</Field>
              <Field label="Total brut" strong>
                {formatEuro(pay.gross)}
              </Field>
            </Fields>
            <div className="border-t border-red-600/20 pt-3">
              <p className="text-xs text-muted-foreground">
                Depuis {member.rank === 'president' ? 'le début de son mandat' : 'son entrée au Gouvernement'}, le{' '}
                {formatDate(member.startDate)}
              </p>
              <LiveCounter monthly={pay.gross} startDate={member.startDate} />
            </div>
          </div>
        </div>

        {member.rank === 'president' && <PresidentNotice member={member} />}

        <Alerts alerts={alerts(member, office)} />

        <Tabs defaultValue="overlaps" className="gap-0 px-6 pb-4">
          <div className="sticky top-0 z-10 -mx-6 bg-popover px-6 py-2">
            <TabsList className="w-full group-data-horizontal/tabs:h-9">
              <TabsTrigger value="overlaps" className={TAB_TRIGGER}>
                Cumuls
              </TabsTrigger>
              <TabsTrigger value="capital" className={TAB_TRIGGER}>
                Capital
              </TabsTrigger>
              <TabsTrigger value="declarations" className={TAB_TRIGGER}>
                Déclarations
              </TabsTrigger>
              <TabsTrigger value="appointment" className={TAB_TRIGGER}>
                {member.rank === 'president' ? 'Élection' : 'Nomination'}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overlaps">
            <OverlapsTab member={member} minimumWage={payScales.minimumWage} localAllowanceCap={null} office={office} />
          </TabsContent>
          <TabsContent value="capital">
            <CapitalTab member={member} office={office} />
          </TabsContent>
          <TabsContent value="declarations">
            <DeclarationsTab member={member} office={office} />
          </TabsContent>
          <TabsContent value="appointment">
            <Appointment member={member} />
          </TabsContent>
        </Tabs>

        <div className="border-t px-6 pb-6">
          <NotesAndSources open={notesOpen} onOpenChange={setNotesOpen}>
            <NoteGroup title="Calcul de la rémunération">
              <PayNote member={member} payScales={payScales} />
            </NoteGroup>
            <NoteGroup title="Cumuls et revenus déclarés">
              <OverlapsNotes member={member} localAllowanceCap={null} office={office} />
            </NoteGroup>
          </NotesAndSources>
        </div>
      </div>
    </>
  )
}

const ELECTION_LAW = 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000684037'

/**
 * Why the President's page differs from a minister's: elected rather than appointed, declarations filed as a
 * candidate and published unchecked, and an end-of-term asset declaration. Only its filing is shown.
 */
function PresidentNotice({ member }: { member: GovernmentMember }) {
  const term = presidentialTerm(member.startDate)
  const asCandidate = member.hatvp.declarations
    .map((d) => d.filedAt)
    .filter((d): d is string => !!d && d < member.startDate)
    .sort()[0]
  const endOfTerm = member.hatvp.declarations.find(
    (d) => (d.type === 'dsp' || d.type === 'dspfm') && (d.filedAt ?? '') > member.startDate,
  )

  const status = endOfTerm?.filedAt
    ? { label: `Déposée le ${formatDate(endOfTerm.filedAt)}`, variant: 'secondary' as const }
    : term.phase === 'upcoming'
      ? { label: `Attendue à partir du ${formatDate(term.declarationFrom)}`, variant: 'outline' as const }
      : term.phase === 'open'
        ? { label: `À déposer d'ici le ${formatDate(term.declarationBy)}`, variant: 'outline' as const }
        : { label: 'Pas encore recensée par la HATVP', variant: 'destructive' as const }

  return (
    <div className="px-6 pb-3">
      <section className="space-y-3 rounded-xl border border-blue-800/30 bg-blue-800/5 p-4 text-sm dark:border-blue-400/30 dark:bg-blue-400/5">
        <h3 className="text-xs font-medium tracking-wider text-blue-800 uppercase dark:text-blue-300">
          Un régime à part
        </h3>
        <ol className="space-y-3">
          <li className="space-y-0.5">
            <p className="font-semibold">Élu, pas nommé</p>
            <p className="text-muted-foreground">
              Élu au suffrage universel pour cinq ans, il ne fait pas partie du Gouvernement. Son mandat ne vient pas
              d'un décret de nomination mais de la proclamation des résultats par le Conseil constitutionnel. Il
              s'achève le {formatDate(term.end)}.
            </p>
          </li>
          <li className="space-y-0.5">
            <p className="font-semibold">Des déclarations de candidat, publiées sans contrôle</p>
            <p className="text-muted-foreground">
              Ses déclarations d'intérêts et de patrimoine ont été déposées
              {asCandidate && ` le ${formatDate(asCandidate)}`} comme candidat, avant l'élection : la loi les exige à
              peine de nullité de la candidature. La HATVP les rend publiques « sans contrôle de leur contenu »
              (article 3 de la loi n° 62-1292 du 6 novembre 1962), alors qu'elle contrôle celles des membres du
              Gouvernement.
            </p>
          </li>
          <li className="space-y-1">
            <p className="font-semibold">Une déclaration de patrimoine de fin de mandat</p>
            <p className="text-muted-foreground">
              Il doit en déposer une nouvelle entre le {formatDate(term.declarationFrom)} et le{' '}
              {formatDate(term.declarationBy)}, six à cinq mois avant la fin du mandat. La HATVP la publie trente
              jours après son dépôt, avec un avis sur l'évolution de son patrimoine depuis le début du mandat.
              L'application n'en indique que le dépôt.
            </p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </li>
        </ol>
        {/* One link per line: ExternalLink breaks anywhere, which would split a link across two lines */}
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          <li>
            Source : <ExternalLink href={ELECTION_LAW}>loi n° 62-1292 du 6 novembre 1962, article 3</ExternalLink>
          </li>
          {member.hatvp.page && (
            <li>
              <ExternalLink href={member.hatvp.page}>Ses déclarations sur hatvp.fr</ExternalLink>
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}

function PayNote({ member, payScales }: { member: GovernmentMember; payScales: GovernmentPayScales }) {
  const head = member.rank === 'president' || member.rank === 'pm'
  const average = formatEuro(payScales.horsEchelleAverage)
  return (
    <>
      <Note>
        Le décret n° 2012-983 fixe le traitement brut mensuel par rapport à la moyenne du plus bas et du plus haut
        traitement de la fonction publique « hors échelle », soit {average} :{' '}
        {head
          ? 'le double de cette moyenne, majoré de 5 %, pour le Président de la République et le Premier ministre'
          : '1,4 fois cette moyenne pour les ministres et les ministres délégués'}
        . S'y ajoutent une indemnité de résidence de 3 % du traitement et une indemnité de fonction de 25 % du traitement
        et de l'indemnité de résidence. Montants bruts, avant cotisations et impôt.
      </Note>
      <Note>
        Ne sont pas comptés : les membres du cabinet, le logement et la voiture de fonction, les frais de représentation
        et de déplacement{member.rank === 'president' && ", ni le budget de l'Élysée"}.
      </Note>
      <Note>
        Source :{' '}
        {payScales.sources.map((s) => (
          <ExternalLink key={s.url} href={s.url}>
            {s.label}
          </ExternalLink>
        ))}
        .
      </Note>
    </>
  )
}

/** "Nomination" tab: title, appointment decree(s), birth date, HATVP page */
function Appointment({ member }: { member: GovernmentMember }) {
  const born = formatDate(member.birthDate)
  const feminine = member.honorific === 'Mme'
  return (
    <div className="divide-y">
      <Section title="Fonction">
        <p>{member.role}</p>
        <Fields>
          <Field label={member.rank === 'president' ? 'Mandat en cours depuis' : 'Au Gouvernement depuis'}>
            {formatDate(member.startDate)}
          </Field>
          {member.roleDecree && <Field label="Fonction actuelle depuis">{formatDate(member.roleStart)}</Field>}
        </Fields>
      </Section>

      <Section title="Textes officiels">
        <ul className="space-y-1.5 text-sm">
          <li>
            <ExternalLink href={member.appointedBy.url}>{member.appointedBy.title}</ExternalLink>
          </li>
          {member.roleDecree && (
            <li>
              <ExternalLink href={member.roleDecree.url}>{member.roleDecree.title}</ExternalLink>
            </li>
          )}
        </ul>
      </Section>

      {born && (
        <Section title="Biographie">
          <Fields>
            <Field label={feminine ? 'Née le' : 'Né le'}>
              {born} ({age(member.birthDate)} ans)
            </Field>
          </Fields>
          <Note>Date de naissance indiquée dans sa déclaration d'intérêts.</Note>
        </Section>
      )}

      {member.hatvp.page && (
        <div className="py-4 text-sm">
          <ExternalLink href={member.hatvp.page}>Sa page sur hatvp.fr</ExternalLink>
        </div>
      )}
    </div>
  )
}
