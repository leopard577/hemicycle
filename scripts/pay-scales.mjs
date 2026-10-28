// Official amounts, entered by hand. Update them when a new scale is published, then rerun `npm run data`.

// Monthly SMIC (35 h) as of 1 June 2026 (automatic increase, order of 22 May 2026)
export const minimumWage = {
  gross: 1867.02,
  net: 1477.93,
  updatedAt: '2026-06',
  source: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2300',
}

// Source: Assemblée nationale, fiche de synthèse n° 7 "La situation matérielle du député"
// (updated January 2026). Monthly amounts in euros.
export const deputyPayScales = {
  source:
    'https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute',
  updatedAt: '2026-01',
  allowance: { base: 5931.95, residence: 177.96, office: 1527.48, gross: 7637.39, net: 5953.34 },
  expenseAllowance: 7238.04,
  staffBudget: 11463,
  maxStaff: 5,
  localAllowanceCap: 2965.98,
  minimumWage,
}

// Deputies' special allowances (gross per month, same fiche n° 7), keyed by [organ type, organ, role]
export const DEPUTY_SPECIAL_ALLOWANCES = [
  { organType: 'BUREAU', organ: "Bureau de l'Assemblée", role: 'Président', label: "Président de l'Assemblée", amount: 7698.5 },
  { organType: 'BUREAU', organ: "Bureau de l'Assemblée", role: 'Questeur', label: 'Questeur', amount: 5300.36 },
  { organType: 'BUREAU', organ: "Bureau de l'Assemblée", role: 'Vice-Président', label: "Vice-président de l'Assemblée", amount: 1099.79 },
  { organType: 'BUREAU', organ: "Bureau de l'Assemblée", role: 'Secrétaire', label: 'Secrétaire du Bureau', amount: 733.19 },
  { organType: 'COMPER', role: 'Président', label: 'Président de commission permanente', amount: 931.76 },
  { organType: 'COMPER', role: 'Rapporteur général', label: 'Rapporteur général', amount: 931.76 },
  { organType: 'OFFPAR', organ: /choix scientifiques et technologiques/i, role: 'Président', label: "Président de l'OPECST", amount: 931.76 },
]
