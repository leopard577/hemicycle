import { Badge } from '@/components/ui/badge'
import { declarationsDe, etatDeclaration, INTERETS, PATRIMOINE } from '@/lib/declarations'
import { formatDate } from '@/lib/format'
import type { DeclarationHatvp, Depute, TypeDeclaration } from '@/types'
import { ExternalLink, MissingData, Note, Section } from './parts'

export function DeclarationsTab({ depute }: { depute: Depute }) {
  const { declarations, page } = depute.hatvp

  return (
    <div className="divide-y">
      <Section title="Situation patrimoniale">
        <Liste
          declarations={declarations}
          types={PATRIMOINE}
          absent="Aucune déclaration de situation patrimoniale enregistrée"
        />
        <Note>
          Le contenu des déclarations de patrimoine des parlementaires n'est pas publié en ligne : il est consultable par les
          électeurs en préfecture, et sa diffusion est interdite (art. LO 135-2 du code électoral). Seul leur dépôt est
          indiqué ici.
        </Note>
      </Section>

      <Section title="Intérêts et activités">
        <Liste declarations={declarations} types={INTERETS} absent="Aucune déclaration d'intérêts enregistrée" />
      </Section>

      {page && (
        <div className="py-4">
          <ExternalLink href={page}>Page du député sur hatvp.fr</ExternalLink>
        </div>
      )}
    </div>
  )
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
    <ul className="space-y-3">
      {items.map((d, i) => {
        const { label, etat } = etatDeclaration(d)
        return (
          <li key={i} className="space-y-1">
            <div className="font-medium">{d.libelle}</div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={ETAT_VARIANT[etat]}>{label}</Badge>
              {d.dateDepot && <span>Déposée le {formatDate(d.dateDepot)}</span>}
              {d.datePublication && <span>· publiée le {formatDate(d.datePublication)}</span>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
