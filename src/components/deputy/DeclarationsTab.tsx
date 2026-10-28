import { Badge } from '@/components/ui/badge'
import { ASSETS, declarationsOf, declarationStatus, INTERESTS, KIND } from '@/lib/declarations'
import { formatDate } from '@/lib/format'
import type { DeclarationType, Deputy, HatvpDeclaration } from '@/types'
import { ExternalLink, MissingData, Section } from './parts'

export function DeclarationsTab({ deputy }: { deputy: Deputy }) {
  const { declarations, page } = deputy.hatvp

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
}: {
  declarations: HatvpDeclaration[]
  types: DeclarationType[]
  emptyTitle: string
}) {
  const items = declarationsOf(declarations, types)
  if (!items.length) return <MissingData missing title={emptyTitle} />

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
