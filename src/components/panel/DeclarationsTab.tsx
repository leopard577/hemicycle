import { Badge } from '@/components/ui/badge'
import { ASSETS, declarationsOf, declarationStatus, INTERESTS, KIND } from '@/lib/declarations'
import { formatDate } from '@/lib/format'
import { pendingDeadline } from '@/lib/money'
import type { Office } from '@/lib/offices'
import type { DeclarationType, HatvpDeclaration, Parliamentarian } from '@/types'
import { ExternalLink, MissingData, Section } from './parts'

export function DeclarationsTab({ member, office }: { member: Parliamentarian; office: Office }) {
  const { declarations, page } = member.hatvp
  // Still within the legal deadline after taking office: a missing declaration is expected, not late
  const dueDate = pendingDeadline(member.startDate)
  const who = office.the(member.honorific === 'Mme')

  return (
    <div className="divide-y">
      <Section title="Intérêts et activités">
        <Intro>
          Activités professionnelles, mandats, fonctions et participations financières. Le détail publié figure dans
          l'onglet « Intérêts ».
        </Intro>
        <DeclarationList
          declarations={declarations}
          types={INTERESTS}
          emptyTitle="Aucune déclaration d'intérêts enregistrée"
          dueDate={dueDate}
          who={who}
        />
      </Section>

      <Section title="Patrimoine">
        <Intro>
          Patrimoine en début et en fin de mandat. Son contenu se consulte uniquement en préfecture et sa diffusion est
          interdite (art. LO 135-2 du code électoral) : seul le dépôt est indiqué ici.
        </Intro>
        <DeclarationList
          declarations={declarations}
          types={ASSETS}
          emptyTitle="Aucune déclaration de situation patrimoniale enregistrée"
          dueDate={dueDate}
          who={who}
        />
      </Section>

      {page && (
        <div className="py-4 text-sm">
          <ExternalLink href={page}>Sa page sur hatvp.fr</ExternalLink>
        </div>
      )}
    </div>
  )
}

function Intro({ children }: { children: string }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

const STATUS_VARIANT = { published: 'secondary', pending: 'outline', missing: 'destructive' } as const

function DeclarationList({
  declarations,
  types,
  emptyTitle,
  dueDate,
  who,
}: {
  declarations: HatvpDeclaration[]
  types: DeclarationType[]
  emptyTitle: string
  /** End of the legal deadline when it has not passed yet */
  dueDate: string | null
  who: string
}) {
  const items = declarationsOf(declarations, types)
  if (!items.length)
    return dueDate ? (
      <MissingData title="Déclaration attendue">
        {`La HATVP n'en enregistre pas encore : ${who} a jusqu'au ${formatDate(dueDate)} pour la déposer.`}
      </MissingData>
    ) : (
      <MissingData missing title={emptyTitle} />
    )

  return (
    <ul className="divide-y rounded-lg border">
      {items.map((d, i) => {
        const { label, status } = declarationStatus(d)
        const dates = [
          d.filedAt && `Déposée le ${formatDate(d.filedAt)}`,
          d.publishedAt && `publiée le ${formatDate(d.publishedAt)}`,
        ].filter(Boolean)
        return (
          <li key={i} className="space-y-1 px-3 py-2.5" title={d.label}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium">{KIND[d.type]}</span>
              <Badge variant={STATUS_VARIANT[status]} className="h-auto max-w-1/2 whitespace-normal text-right">
                {label}
              </Badge>
            </div>
            {dates.length > 0 && <p className="text-sm text-muted-foreground">{dates.join(', ')}</p>}
          </li>
        )
      })}
    </ul>
  )
}
