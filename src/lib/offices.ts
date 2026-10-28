// Wording and rules that differ from one office to another (deputy, senator, member of the Government).
// Shared components (hemicycle, panel, alerts, readings) take an `Office` instead of hard-coding "député".
import type { Category } from '@/lib/money'

export interface Office {
  /** Income categories of the office itself: left out of side income */
  ownCategories: Category[]
  /** Parliamentary mandates listed among "other mandates and offices" rather than as side income */
  pastOfficeCategories: Category[]
  /** "le mandat de député", "du mandat de député" */
  mandate: { the: string; of: string }
  /** The law forbids holding a local executive role on top of this office (parliamentarians, since 2017) */
  localExecutiveBanned: boolean
  /** What the app shows of asset declarations, and why */
  assetsNote: string
  /** Declarations are filed before taking office (presidential candidates), so none is "late" */
  declaresBeforeOffice: boolean
  noun: string
  plural: string
  /** "Député" / "Députée", for the panel header */
  title: (feminine: boolean) => string
  /** "le député" / "la députée" */
  the: (feminine: boolean) => string
  /** "l'Assemblée", "le Sénat" */
  institution: string
  /** "de l'Assemblée", "du Sénat" */
  ofInstitution: string
  /** Accessible name of the hemicycle chart */
  chartLabel: string
  /** Roles that give a function allowance, as an example list */
  specialRolesExample: string
  /** What the expense and staff envelopes are, in the calculation note */
  envelopeNote: (feminine: boolean) => string
  /** How the expense allowance is used and checked, in the pay notes */
  expensesNote: string
  /** Remark about the staff list, when the chamber publishes one in its open data */
  staffNote: string | null
}

const PARLIAMENTARY_ASSETS =
  "Patrimoine en début et en fin de mandat. Son contenu se consulte uniquement en préfecture et sa diffusion est interdite (art. LO 135-2 du code électoral) : seul le dépôt est indiqué ici."

export const DEPUTY: Office = {
  ownCategories: ['deputy'],
  pastOfficeCategories: ['european', 'senate', 'government'],
  mandate: { the: 'le mandat de député', of: 'du mandat de député' },
  localExecutiveBanned: true,
  assetsNote: PARLIAMENTARY_ASSETS,
  declaresBeforeOffice: false,
  noun: 'député',
  plural: 'députés',
  title: (f) => (f ? 'Députée' : 'Député'),
  the: (f) => (f ? 'la députée' : 'le député'),
  institution: "l'Assemblée",
  ofInstitution: "de l'Assemblée",
  chartLabel: "Hémicycle de l'Assemblée nationale",
  specialRolesExample: "présidence de l'Assemblée ou d'une commission, questeur, membre du Bureau…",
  envelopeNote: () =>
    "Ce sont des enveloppes maximales. Le crédit collaborateurs paie les salaires de ses assistants et n'est pas versé au député ; la part non utilisée n'est pas dépensée. Les frais de mandat non utilisés sont reversés en fin de mandat.",
  expensesNote:
    "L'avance de frais de mandat couvre les dépenses liées au mandat. Le détail des dépenses de chaque député n'est pas rendu public.",
  staffNote: "La liste de l'Assemblée n'est pas datée et peut inclure des collaborateurs successifs.",
}

export const SENATOR: Office = {
  ownCategories: ['senate'],
  pastOfficeCategories: ['deputy', 'european', 'government'],
  mandate: { the: 'le mandat de sénateur', of: 'du mandat de sénateur' },
  localExecutiveBanned: true,
  assetsNote: PARLIAMENTARY_ASSETS,
  declaresBeforeOffice: false,
  noun: 'sénateur',
  plural: 'sénateurs',
  title: (f) => (f ? 'Sénatrice' : 'Sénateur'),
  the: (f) => (f ? 'la sénatrice' : 'le sénateur'),
  institution: 'le Sénat',
  ofInstitution: 'du Sénat',
  chartLabel: 'Hémicycle du Sénat',
  specialRolesExample:
    "présidence du Sénat, d'un groupe, d'une commission permanente ou d'une délégation, questeur, membre du Bureau…",
  envelopeNote: (f) =>
    `Ce sont des enveloppes maximales. Le crédit collaborateurs paie les salaires de ses assistants et n'est pas versé ${f ? 'à la sénatrice' : 'au sénateur'} ; la part non utilisée n'est pas dépensée. Chaque dépense payée avec l'avance de frais de mandat doit être justifiée. Les avances dédiées (informatique, hébergement à Paris, représentation) ne sont pas comptées.`,
  expensesNote:
    "L'avance générale de frais de mandat couvre les dépenses liées au mandat ; elles sont justifiées et contrôlées chaque année par le Comité de déontologie parlementaire du Sénat. Le Sénat verse aussi des avances dédiées, non comptées ici : informatique (6 000 € pour trois ans), hébergement à Paris (1 500 € par mois, selon la situation) et représentation (750 € par mois pour certaines fonctions).",
  staffNote: null,
}

/**
 * Members of the Government. A parliamentary mandate ends a month after joining the Government, and the
 * ministerial pay itself is often declared as a job: neither is side income here, both are listed among
 * past offices.
 */
export const GOVERNMENT_MEMBER: Office = {
  ownCategories: ['deputy', 'senate', 'european', 'government'],
  pastOfficeCategories: ['deputy', 'senate', 'european', 'government'],
  mandate: { the: 'la fonction ministérielle', of: 'de la fonction ministérielle' },
  // No law forbids a minister to stay a local councillor or mayor
  localExecutiveBanned: false,
  declaresBeforeOffice: false,
  assetsNote:
    "Patrimoine en début et en fin de fonctions. La HATVP publie le contenu des déclarations de patrimoine des membres du Gouvernement sur son site ; l'application n'en reprend que le dépôt et ses dates.",
  noun: 'membre du Gouvernement',
  plural: 'membres du Gouvernement',
  title: () => 'Membre du Gouvernement',
  the: (f) => (f ? 'la ministre' : 'le ministre'),
  institution: "l'État",
  ofInstitution: "de l'État",
  chartLabel: 'Gouvernement',
  specialRolesExample: '',
  envelopeNote: () => '',
  expensesNote: '',
  staffNote: null,
}

/** The President of the Republic: same rules as the Government, but declarations are filed as a candidate */
export const PRESIDENT: Office = {
  ...GOVERNMENT_MEMBER,
  mandate: { the: 'le mandat présidentiel', of: 'du mandat présidentiel' },
  declaresBeforeOffice: true,
  assetsNote:
    "Patrimoine en début et en fin de mandat. La HATVP publie le contenu de ces déclarations ; l'application n'en reprend que le dépôt et ses dates.",
  the: (f) => (f ? 'la Présidente de la République' : 'le Président de la République'),
}
