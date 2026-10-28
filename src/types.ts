export interface Group {
  id: string
  abbrev: string
  label: string
  color: string
}

export interface Committee {
  label: string
  role: string
}

/**
 * Fields shared by every public official, whatever the page (deputies, senators, government…):
 * identity, HATVP declarations and RNE local mandates.
 */
export interface Official {
  id: string
  /** "M." or "Mme" */
  honorific: string
  firstName: string
  lastName: string
  birthDate: string | null
  photo: string
  /** Start date of the office the page is about */
  startDate: string
  hatvp: Hatvp
  /** Local mandates currently held, according to the Répertoire national des élus */
  localMandates: LocalMandate[]
}

/** Member of either chamber of Parliament: what the hemicycle, the panel and the readings need */
export interface Parliamentarian extends Official {
  sortName: string
  profession: string | null
  groupId: string | null
  groupRole: string | null
  /** Real seat number in the hemicycle */
  seat: number | null
  committees: Committee[]
  email: string | null
  twitter: string | null
  specialAllowances: SpecialAllowance[]
}

export interface Deputy extends Parliamentarian {
  birthPlace: string | null
  party: string | null
  department: string | null
  departmentCode: string | null
  constituency: string | null
  region: string | null
  firstTerm: boolean
  website: string | null
  staffCount: number
}

export interface Senator extends Parliamentarian {
  /** "Apparenté" or "Rattaché administrativement" when not a full group member */
  affiliation: string | null
  /** Department (or "Français établis hors de France") the senator represents */
  constituency: string | null
  constituencyCode: string | null
  /** Renewal series, "1" or "2" */
  series: string | null
  bureauRole: string | null
  senatPage: string | null
}

export type LocalMandateType =
  | 'municipal'
  | 'district'
  | 'intercommunal'
  | 'departmental'
  | 'regional'
  | 'territorial'
  | 'european'

export interface LocalMandate {
  type: LocalMandateType
  label: string
  place: string | null
  /** Mayor, deputy mayor, vice-president…; null for a plain councillor */
  role: string | null
  start: string | null
  roleStart: string | null
  /** Update date of the RNE file */
  updatedAt: string | null
}

/** Office for which the same person filed a declaration with the HATVP */
export interface OtherHatvpMandate {
  type: string
  institution: string
  role: string | null
  lastFiledAt: string | null
}

export interface SpecialAllowance {
  label: string
  /** Organ whose role grants the allowance */
  body: string
  amount: number
}

export interface YearlyAmount {
  year: number
  amount: number | null
}

export interface Income {
  title: string | null
  organization: string | null
  start: string | null
  end: string | null
  grossNet: string | null
  amounts: YearlyAmount[]
}

export interface Holding {
  company: string
  value: number | null
  capitalShare: string | null
  shareCount: string | null
  income: string | null
}

/** null = section missing from the declaration, [] = "néant" (none) declared */
type DeclarationSection<T> = T[] | null

export interface Interests {
  filedAt: string | null
  amended: boolean
  jobs: DeclarationSection<Income>
  mandates: DeclarationSection<Income>
  consulting: DeclarationSection<Income>
  directorships: DeclarationSection<Income>
  holdings: DeclarationSection<Holding>
}

export type DeclarationType = 'dia' | 'diam' | 'dsp' | 'dspm' | 'dspfm'

export interface HatvpDeclaration {
  type: DeclarationType
  label: string
  filedAt: string | null
  publishedAt: string | null
  /** Raw HATVP status ("Livrée", "En cours"…) */
  status: string | null
}

export interface Hatvp {
  page: string | null
  declarations: HatvpDeclaration[]
  interests: Interests | null
  otherMandates: OtherHatvpMandate[]
}

export interface MinimumWage {
  gross: number
  net: number
  updatedAt: string
  source: string
}

export interface PayScales {
  sources: { label: string; url: string }[]
  updatedAt: string
  allowance: { base: number; residence: number; office: number; gross: number; net: number }
  expenseAllowance: number
  staffBudget: number
  maxStaff: number
  /** Monthly cap on local allowances on top of the parliamentary allowance */
  localAllowanceCap: number
  minimumWage: MinimumWage
}

/** One chamber's page dataset (deputies.json, senators.json) */
export interface ChamberDataset<T extends Parliamentarian> {
  generatedAt: string
  payScales: PayScales
  groups: Group[]
  /** Ordered by group, then seat number: `members[i]` sits on seat `i` */
  members: T[]
}
