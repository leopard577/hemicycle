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
  sources: [
    {
      label: 'Assemblée nationale, fiche n° 7',
      url: 'https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute',
    },
  ],
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

// Sources: Sénat, "L'indemnité parlementaire" (updated 30 March 2026), "Les frais de mandat" (updated
// 20 January 2025) and "Les moyens mis à la disposition des sénateurs" (staff credit as of 1 July 2023).
// Monthly amounts in euros. The allowance is set by the same ordinance as the deputies'.
export const senatorPayScales = {
  sources: [
    {
      label: 'Sénat, « L’indemnité parlementaire »',
      url: 'https://www.senat.fr/connaitre-le-senat/role-et-fonctionnement/lindemnite-parlementaire.html',
    },
    {
      label: 'Sénat, « Les frais de mandat »',
      url: 'https://www.senat.fr/connaitre-le-senat/role-et-fonctionnement/les-frais-de-mandat.html',
    },
    {
      label: 'Sénat, « Les moyens mis à la disposition des sénateurs »',
      url: 'https://www.senat.fr/connaitre-le-senat/role-et-fonctionnement/les-moyens-mis-a-la-disposition-des-senateurs.html',
    },
  ],
  updatedAt: '2026-03',
  allowance: { base: 5931.95, residence: 177.96, office: 1527.48, gross: 7637.39, net: 5676.12 },
  // General monthly expense advance; the dedicated advances (IT, Paris lodging, representation) are left out
  expenseAllowance: 6600,
  staffBudget: 8827.4,
  maxStaff: 5,
  localAllowanceCap: 2965.98,
  minimumWage,
}

// Senators' function allowances (gross per month, "L'indemnité parlementaire"). `source` names the Sénat
// file the role is read from, `role` matches its function column.
export const SENATOR_SPECIAL_ALLOWANCES = [
  { source: 'bureau', role: /^Président du Sénat$/, label: 'Président du Sénat', amount: 7591.58 },
  { source: 'bureau', role: /^Vice-président(e)? du Sénat$/, label: 'Vice-président du Sénat', amount: 2184.3 },
  { source: 'bureau', role: /^Questeure? du Sénat$/, label: 'Questeur', amount: 4444.97 },
  { source: 'bureau', role: /^Secrétaire du Sénat$/, label: 'Secrétaire du Bureau', amount: 748.7 },
  { source: 'group', role: /^Président$/, label: 'Président de groupe politique', amount: 2184.3 },
  { source: 'committee', role: /^Président$/, label: 'Président de commission permanente', amount: 2184.3 },
  { source: 'committee', role: /^Rapporteur général$/, label: 'Rapporteur général', amount: 2184.3 },
  { source: 'delegation', role: /^Président$/, label: 'Président de délégation', amount: 2016.27 },
  { source: 'opecst', role: /^Président$/, label: "Président de l'OPECST", amount: 931.76 },
]

// Pay of the President of the Republic and of members of the Government, decree no. 2012-983 of
// 23 August 2012: a gross monthly salary of 1.4 times the average of the lowest and highest "hors échelle"
// civil-service salaries for ministers and ministers delegate (art. 2), and twice that average plus 5% for the
// President and the Prime Minister (art. 1 and 3); plus a residence allowance of 3% of the salary and a
// function allowance of 25% of salary + residence allowance (art. 1). The average is the parliamentary base
// allowance, defined the same way (ordinance 58-1210), so it follows the same updates.
const HORS_ECHELLE_AVERAGE = deputyPayScales.allowance.base
const round = (n) => Math.round(n * 100) / 100

function governmentPay(coefficient) {
  const salary = round(HORS_ECHELLE_AVERAGE * coefficient)
  const residence = round(salary * 0.03)
  const office = round((salary + residence) * 0.25)
  return { salary, residence, office, gross: round(salary + residence + office) }
}

export const governmentPayScales = {
  sources: [
    {
      label: 'Décret n° 2012-983 du 23 août 2012',
      url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000026310466',
    },
  ],
  updatedAt: deputyPayScales.updatedAt,
  horsEchelleAverage: HORS_ECHELLE_AVERAGE,
  ranks: {
    president: governmentPay(2 * 1.05),
    pm: governmentPay(2 * 1.05),
    minister: governmentPay(1.4),
    delegate: governmentPay(1.4),
  },
  minimumWage,
}
