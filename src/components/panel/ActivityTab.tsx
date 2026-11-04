import { committeeAttendance, meetingsHeld, percent, votesCast } from '@/lib/activity'
import { formatDate } from '@/lib/format'
import type { ParliamentaryActivity } from '@/types'
import { ExternalLink, Field, Fields, KeyFigure, Note, Section } from './parts'

const count = (n: number) => n.toLocaleString('fr-FR')

/** "Activité" tab: votes, committee meetings and bills since the start of the current term */
export function ActivityTab({ activity, since }: { activity: ParliamentaryActivity; since: string }) {
  const { votes, committeeMeetings: meetings, bills } = activity
  const attendance = committeeAttendance(activity)
  return (
    <div className="divide-y">
      <div className="py-4">
        <Note>Depuis le début du mandat en cours, le {formatDate(since)}.</Note>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          <KeyFigure label="Votes" value={count(votesCast(activity))} hint={`sur ${count(votes.scrutins)} scrutins`} />
          <KeyFigure
            label="Présence"
            value={attendance === null ? '—' : percent(attendance)}
            hint="en commission"
          />
          <KeyFigure label="Prop. de loi" value={count(bills.authored.length)} hint="déposées" />
        </dl>
      </div>

      <Section title="Votes en séance">
        <Fields>
          <Field label="Pour">{count(votes.for)}</Field>
          <Field label="Contre">{count(votes.against)}</Field>
          <Field label="Abstention">{count(votes.abstain)}</Field>
          {votes.nonVoting > 0 && <Field label="Non-votant">{count(votes.nonVoting)}</Field>}
          <Field label="Dont par délégation">{count(votes.delegated)}</Field>
        </Fields>
        <Note>
          Scrutins publics uniquement. Beaucoup portent sur des amendements examinés avec peu de députés présents : ne pas
          avoir voté ne veut pas dire avoir été absent de l'Assemblée. Un vote par délégation est déposé par un collègue et
          ne prouve pas la présence.
        </Note>
      </Section>

      <Section title="Réunions de commission">
        <Fields>
          <Field label="Réunions">{count(meetingsHeld(activity))}</Field>
          <Field label="Présent">{count(meetings.present)}</Field>
          <Field label="Excusé">{count(meetings.excused)}</Field>
          <Field label="Absent">{count(meetings.absent)}</Field>
        </Fields>
        <Note>
          Présences relevées par l'Assemblée pour les commissions dont le député est membre. Un rôle de président, de
          ministre, ou le travail en séance, en circonscription et en mission n'y apparaissent pas. Sous 10 réunions, aucun
          pourcentage n'est calculé.
        </Note>
      </Section>

      <Section title="Propositions de loi déposées">
        {bills.authored.length ? (
          <ul className="space-y-2 text-sm">
            {bills.authored.map((b) => (
              <li key={b.url} className="space-y-0.5">
                <ExternalLink href={b.url}>{b.title}</ExternalLink>
                <div className="text-xs text-muted-foreground">Déposée le {formatDate(b.date)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <Note>Aucune proposition de loi déposée comme auteur sur cette période.</Note>
        )}
        <Note>
          Déposées à l'Assemblée comme auteur, sans les cosignatures ({count(bills.cosigned)}) ni les textes du Sénat. Une
          proposition peut n'être jamais discutée.
        </Note>
      </Section>
    </div>
  )
}
