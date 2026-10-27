export interface Groupe {
  id: string
  abrev: string
  libelle: string
  couleur: string
}

export interface Commission {
  libelle: string
  qualite: string
}

export interface Depute {
  id: string
  civ: string
  prenom: string
  nom: string
  alpha: string
  dateNais: string | null
  villeNais: string | null
  profession: string | null
  groupeId: string | null
  qualiteGroupe: string | null
  parti: string | null
  departement: string | null
  numDepartement: string | null
  numCirco: string | null
  region: string | null
  dateDebut: string
  premiereElection: boolean
  placeHemicycle: number | null
  commissions: Commission[]
  email: string | null
  site: string | null
  twitter: string | null
  hatvp: Hatvp
  photo: string
  indemnitesSpeciales: IndemniteSpeciale[]
  nbCollaborateurs: number
}

export interface IndemniteSpeciale {
  libelle: string
  organe: string
  montant: number
}

export interface MontantAnnuel {
  annee: number
  montant: number | null
}

export interface Revenu {
  intitule: string | null
  organisme: string | null
  debut: string | null
  fin: string | null
  brutNet: string | null
  montants: MontantAnnuel[]
}

export interface Participation {
  societe: string
  evaluation: number | null
  capitalDetenu: string | null
  nombreParts: string | null
  remuneration: string | null
}

/** null = rubrique absente de la déclaration, [] = « néant » déclaré */
type Rubrique<T> = T[] | null

export interface Interets {
  dateDepot: string | null
  modificative: boolean
  activites: Rubrique<Revenu>
  mandats: Rubrique<Revenu>
  consultant: Rubrique<Revenu>
  dirigeant: Rubrique<Revenu>
  participations: Rubrique<Participation>
}

export type TypeDeclaration = 'dia' | 'diam' | 'dsp' | 'dspm' | 'dspfm'

export interface DeclarationHatvp {
  type: TypeDeclaration
  libelle: string
  dateDepot: string | null
  datePublication: string | null
  statut: string | null
}

export interface Hatvp {
  page: string | null
  declarations: DeclarationHatvp[]
  interets: Interets | null
}

export interface Baremes {
  source: string
  miseAJour: string
  indemnite: { base: number; residence: number; fonction: number; brut: number; net: number }
  dotationFonctionnement: number
  creditCollaborateurs: number
  maxCollaborateurs: number
  plafondCumul: number
}

export interface Dataset {
  generatedAt: string
  baremes: Baremes
  groupes: Groupe[]
  deputes: Depute[]
}
