import type { DeclarationType, HatvpDeclaration } from '@/types'

export const INTERESTS: DeclarationType[] = ['dia', 'diam', 'di', 'dim']
export const ASSETS: DeclarationType[] = ['dsp', 'dspm', 'dspfm']

/** Kind of filing, without repeating the declaration type already given by the section */
export const KIND: Record<DeclarationType, string> = {
  dia: 'Déclaration initiale',
  diam: 'Mise à jour',
  di: 'Déclaration initiale',
  dim: 'Mise à jour',
  dsp: 'Déclaration initiale',
  dspm: 'Mise à jour',
  dspfm: 'Fin de mandat',
}

export type Status = 'published' | 'pending' | 'missing'

/** Turns the raw HATVP status into a readable label */
export function declarationStatus(d: HatvpDeclaration): { label: string; status: Status } {
  const assets = ASSETS.includes(d.type)
  switch (d.status) {
    case 'Livrée':
      return { label: assets ? 'Consultable en préfecture' : 'Publiée', status: 'published' }
    case 'Déclaration déposée - publication à venir':
      return { label: 'Déposée, publication à venir', status: 'pending' }
    case 'Déclaration déposée - publication en préfecture à venir':
      return { label: 'Déposée, consultation en préfecture à venir', status: 'pending' }
    case 'En cours':
      return { label: 'En cours de traitement par la HATVP', status: 'pending' }
    default:
      return { label: d.status ?? 'Statut inconnu', status: 'pending' }
  }
}

/** Declarations of the given types, most recent first */
export function declarationsOf(declarations: HatvpDeclaration[], types: DeclarationType[]) {
  return declarations.filter((d) => types.includes(d.type))
}
