// Wording that differs from one chamber to the other. Shared components (hemicycle, panel, alerts,
// readings) take an `Office` instead of hard-coding "député".
import type { Category } from '@/lib/money'

export interface Office {
  /** Income category of the office itself: left out of side income */
  category: Category
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

export const DEPUTY: Office = {
  category: 'deputy',
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
  category: 'senate',
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
