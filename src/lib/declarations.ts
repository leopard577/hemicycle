import type { DeclarationHatvp, TypeDeclaration } from '@/types'

export const INTERETS: TypeDeclaration[] = ['dia', 'diam']
export const PATRIMOINE: TypeDeclaration[] = ['dsp', 'dspm', 'dspfm']

export type Etat = 'publiee' | 'attente' | 'manquante'

/** Traduit le statut brut de la HATVP en libellé lisible */
export function etatDeclaration(d: DeclarationHatvp): { label: string; etat: Etat } {
  const patrimoine = PATRIMOINE.includes(d.type)
  switch (d.statut) {
    case 'Livrée':
      return { label: patrimoine ? 'Consultable en préfecture' : 'Publiée', etat: 'publiee' }
    case 'Déclaration déposée - publication à venir':
      return { label: 'Déposée, publication à venir', etat: 'attente' }
    case 'Déclaration déposée - publication en préfecture à venir':
      return { label: 'Déposée, consultation en préfecture à venir', etat: 'attente' }
    case 'En cours':
      return { label: 'En cours de traitement par la HATVP', etat: 'attente' }
    default:
      return { label: d.statut ?? 'Statut inconnu', etat: 'attente' }
  }
}

/** Déclarations d'un type donné, la plus récente en premier */
export function declarationsDe(declarations: DeclarationHatvp[], types: TypeDeclaration[]) {
  return declarations.filter((d) => types.includes(d.type))
}
