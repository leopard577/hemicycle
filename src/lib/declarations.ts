import type { Office } from '@/lib/offices'
import type { DeclarationType, HatvpDeclaration } from '@/types'

export const INTERESTS: DeclarationType[] = ['dia', 'diam', 'di', 'dim']
export const ASSETS: DeclarationType[] = ['dsp', 'dspm', 'dspfm']
/** Declarations filed on taking office, as opposed to modifications and end-of-term ones */
export const INITIAL_INTERESTS: DeclarationType[] = ['dia', 'di']
export const INITIAL_ASSETS: DeclarationType[] = ['dsp']

/** What the HATVP writes in place of a field it does not publish: reproduced as is, never reworded */
export const REDACTED = '[Données non publiées]'

/** A declared text field as published; an empty field is said to be empty, not "unpublished" */
export const asPublished = (v: string | null) => v ?? 'Non renseigné'

/** "brut" or "net" when the declaration says so plainly, else null (field redacted or free text) */
export const plainGrossNet = (v: string | null) => (v && /^(brut|net)$/i.test(v) ? v.toLowerCase() : null)

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

/** Turns the raw HATVP status into a readable label; where a delivered asset declaration can be read depends on the office */
export function declarationStatus(d: HatvpDeclaration, office: Office): { label: string; status: Status } {
  const inPrefecture = office.assetsInPrefecture && ASSETS.includes(d.type)
  switch (d.status) {
    case 'Livrée':
      return { label: inPrefecture ? 'Consultable en préfecture' : 'Publiée', status: 'published' }
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
