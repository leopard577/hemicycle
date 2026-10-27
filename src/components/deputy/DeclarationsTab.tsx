import { Badge } from '@/components/ui/badge'
import { declarationsDe, etatDeclaration, INTERETS, NATURE, PATRIMOINE } from '@/lib/declarations'
import { formatDate } from '@/lib/format'
import type { DeclarationHatvp, Depute, TypeDeclaration } from '@/types'
import { ExternalLink, MissingData, Section } from './parts'

export function DeclarationsTab({ depute }: { depute: Depute }) {
  const { declarations, page } = depute.hatvp

  return (
    <div className="divide-y">
      <Section title="Intérêts et activités">
        <Intro>
          Activités professionnelles, mandats, fonctions et participations financières. Le détail publié figure dans
          l'onglet « Intérêts ».
        </Intro>
        <Liste declarations={declarations} types={INTERETS} absent="Aucune déclaration d'intérêts enregistrée" />
      </Section>

      <Section title="Patrimoine">
        <Intro>
          Patrimoine en début et en fin de mandat. Son contenu se consulte uniquement en préfecture et sa diffusion est
          interdite (art. LO 135-2 du code électoral) : seul le dépôt est indiqué ici.
        </Intro>
        <Liste
          declarations={declarations}
          types={PATRIMOINE}
          absent="Aucune déclaration de situation patrimoniale enregistrée"
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

const ETAT_VARIANT = { publiee: 'secondary', attente: 'outline', manquante: 'destructive' } as const

function Liste({
  declarations,
  types,
  absent,
}: {
  declarations: DeclarationHatvp[]
  types: TypeDeclaration[]
  absent: string
}) {
  const items = declarationsDe(declarations, types)
  if (!items.length) return <MissingData missing title={absent} />

  return (
    <ul className="divide-y rounded-lg border">
      {items.map((d, i) => {
        const { label, etat } = etatDeclaration(d)
        const dates = [
          d.dateDepot && `Déposée le ${formatDate(d.dateDepot)}`,
          d.datePublication && `publiée le ${formatDate(d.datePublication)}`,
        ].filter(Boolean)
        return (
          <li key={i} className="space-y-1 px-3 py-2.5" title={d.libelle}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium">{NATURE[d.type]}</span>
              <Badge variant={ETAT_VARIANT[etat]} className="h-auto max-w-1/2 whitespace-normal text-right">
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
