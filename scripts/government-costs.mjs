// What the Government and the Presidency cost beyond the pay of their members: ministerial cabinets, the Élysée
// budget and the budget of each ministry. Cabinets and the Élysée are copied by hand from annexes to the finance
// bill (PLF), published as PDF only; the ministry budgets are read from the bill itself, which the Assemblée
// nationale publishes as HTML in its open data. Update all three every October, when the next PLF is tabled.
import { download } from './lib/util.mjs'

const PLF_2027_DOSSIER = 'https://www.assemblee-nationale.fr/dyn/17/dossiers/PLF_2027'

// PLF for 2027 as tabled (bill no. 3210, 17th legislature)
const PLF_2027_BILL = 'https://www.assemblee-nationale.fr/dyn/opendata/PRJLANR5L17B3210.html'

// Ministry of each line of table 6 of the bill, by the surname of its minister in government.mjs. A ministry
// missing here fails the build: add it after each reshuffle or new PLF.
const MINISTRY_HEADS = {
  'Action et comptes publics': 'Amiel',
  'Agriculture, agro-alimentaire et souveraineté alimentaire': 'Genevard',
  'Aménagement du territoire et de la décentralisation': 'Gatel',
  'Armées et anciens combattants': 'Vautrin',
  Culture: 'Pégard',
  'Économie, finances et souveraineté industrielle, énergétique et numérique': 'Lescure',
  'Éducation nationale': 'Geffray',
  'Enseignement supérieur, recherche et espace': 'Baptiste',
  'Europe et affaires étrangères': 'Barrot',
  Intérieur: 'Nunez',
  Justice: 'Darmanin',
  'Outre-Mer': 'Moutchou',
  'Santé, familles, autonomie et personnes handicapées': 'Rist',
  'Services du Premier ministre': 'Lecornu',
  'Sports, jeunesse et vie associative': 'Ferrari',
  'Transition écologique, biodiversité et négociations internationales sur le climat et la nature': 'Barbut',
  Transports: 'Tabarot',
  'Travail et solidarités': 'Farandou',
  'Ville et logement': 'Jeanbrun',
}

const cellText = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#xa0;|&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Downloads the PLF and reads its annex table 6, "Présentation, regroupée par ministère, des crédits proposés
 * pour <year> par programme du budget général": one row per ministry (class `assnatetatagr`) followed by its
 * programmes (`assnatetatalr`), with commitment authorisations (AE) and payment credits (CP) in euros.
 */
export async function loadMinistryBudgets() {
  const page = await (await download(PLF_2027_BILL)).text()
  const heading = page.lastIndexOf('regroupée par ministère')
  const start = page.indexOf('<table', heading)
  if (heading < 0 || start < 0) throw new Error('PLF: table 6 (crédits regroupés par ministère) not found')
  const table = page.slice(start, page.indexOf('</table>', start))
  const ministries = []
  for (const [, row] of table.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)) {
    const cells = [...row.matchAll(/<p class="([^"]+)"[^>]*>(.*?)<\/p>/gs)].map(([, cls, html]) => ({ cls, text: cellText(html) }))
    if (cells.length !== 3) continue
    const [name, ae, cp] = cells
    const amounts = { ae: Number(ae.text.replace(/\D/g, '')), cp: Number(cp.text.replace(/\D/g, '')) }
    if (name.cls === 'assnatetatagr') ministries.push({ label: name.text, ...amounts, programmes: [] })
    else if (name.cls === 'assnatetatalr' && ministries.length) ministries.at(-1).programmes.push({ label: name.text, ...amounts })
  }
  if (!ministries.length) throw new Error('PLF: no ministry read in table 6')
  for (const m of ministries) {
    const sum = m.programmes.reduce((s, p) => s + p.cp, 0)
    if (sum !== m.cp) throw new Error(`PLF: the programmes of ${m.label} do not add up (${sum} vs ${m.cp})`)
  }
  return ministries
}

/**
 * Attaches each ministry to its minister (`members` from government.mjs) and splits out "crédits évaluatifs"
 * (debt interest, tax refunds…), set by law and by the economy rather than by a policy choice.
 */
export function ministryBudgets(ministries, members) {
  const items = ministries.map((m) => {
    const lastName = MINISTRY_HEADS[m.label]
    if (!lastName) throw new Error(`PLF: ministry "${m.label}" has no minister in MINISTRY_HEADS (government-costs.mjs)`)
    const head = members.find((x) => x.lastName === lastName && x.rank !== 'delegate')
    if (!head) throw new Error(`PLF: minister ${lastName} of "${m.label}" is not in the Government`)
    return {
      label: m.label,
      ministerId: head.id,
      ae: m.ae,
      cp: m.cp,
      evaluative: m.programmes.filter((p) => /crédits évaluatifs/.test(p.label)).reduce((s, p) => s + p.cp, 0),
      programmes: m.programmes.sort((a, b) => b.cp - a.cp),
    }
  })
  return {
    source: { label: 'Projet de loi de finances pour 2027, tableau 6 des informations annexes', url: PLF_2027_BILL },
    year: 2027,
    items: items.sort((a, b) => b.cp - a.cp),
  }
}

// "Personnels affectés dans les cabinets ministériels", annex ("jaune") to the PLF for 2027, situation on
// 1 July 2026 (summary table "Cabinets ministériels au 1er juillet 2026"). Per cabinet: members appointed in the
// Journal officiel, support staff (protection, security, assistance, catering, drivers…), both in physical
// headcount, and the yearly envelope of the special-duty allowance (ISP, decree no. 2001-1148). This edition
// gives no total pay. Keyed by the minister's surname as in MEMBERS / DEPARTURES of government.mjs.
export const cabinets = {
  asOf: '2026-07-01',
  source: {
    label: 'Annexe au PLF pour 2027, « Personnels affectés dans les cabinets ministériels »',
    url: 'https://www.assemblee-nationale.fr/dyn/contenu/visualisation/1129777/file/20-Jaune%202027%20-%20Personnels%20affect%C3%A9s%20dans%20les%20cabinets%20minist%C3%A9riels.pdf',
  },
  totals: { members: 471, support: 2_226, isp: 26_123_841 },
  // Members by function and support staff by task, as in table "a. Les effectifs par fonction"
  byFunction: [
    { label: 'Directeurs', count: 39, group: 'members' },
    { label: 'Directeurs adjoints', count: 47, group: 'members' },
    { label: 'Chefs et chefs adjoints de cabinet', count: 54, group: 'members' },
    { label: 'Conseillers et conseillers techniques', count: 331, group: 'members' },
    { label: 'Protection du ministre', count: 176, group: 'support' },
    { label: 'Sécurité des bâtiments (dont huissiers)', count: 249, group: 'support' },
    { label: 'Assistance (administration, courrier, secrétariat)', count: 1_240, group: 'support' },
    { label: 'Intendance (cuisine, hôtellerie)', count: 328, group: 'support' },
    { label: 'Logistique (dont chauffeurs)', count: 233, group: 'support' },
  ],
  // Cabinet members recruited on contract, i.e. not already civil servants (table "b.", 258 of 471)
  contractMembers: 258,
  byMinister: {
    Lecornu: [74, 418, 6_300_000],
    Panifous: [12, 25, 450_000],
    Bregeon: [12, 34, 350_000],
    Bergé: [7, 25, 350_000],
    Nunez: [14, 241, 1_508_893],
    Berger: [8, 14, 260_442],
    Vedrenne: [8, 21, 216_598],
    Vautrin: [13, 190, 1_190_000],
    Rufo: [8, 19, 254_352],
    Farandou: [14, 40, 762_520],
    Roubache: [7, 27, 484_620],
    Barbut: [14, 33, 500_402],
    Lefèvre: [8, 22, 410_238],
    Chabaud: [8, 21, 383_648],
    Darmanin: [14, 158, 1_218_841],
    Lescure: [14, 40, 544_962],
    Martin: [8, 34, 304_971],
    'Le Hénanff': [8, 32, 266_991],
    Papin: [13, 33, 401_607],
    Genevard: [14, 80, 580_076],
    Geffray: [14, 79, 890_128],
    Barrot: [15, 117, 1_229_122],
    Haddad: [8, 27, 440_192],
    Forissier: [8, 34, 376_518],
    Caroit: [8, 29, 503_368],
    Pégard: [14, 71, 655_558],
    Rist: [14, 43, 710_380],
    'Galliard-Minier': [8, 30, 418_260],
    Moutchou: [14, 52, 582_228],
    Gatel: [14, 27, 480_898],
    // Minister delegate for rurality until 22 September 2026, after the snapshot date
    Fournier: [7, 19, 378_850],
    Amiel: [18, 41, 478_022],
    Baptiste: [13, 50, 662_488],
    Ferrari: [12, 42, 623_432],
    Tabarot: [13, 27, 523_866],
    Jeanbrun: [13, 31, 431_370],
  },
}

// Présidence de la République: dotation no. 501 of the "Pouvoirs publics" mission and the presidency's own
// budget document, annexed to the PLF for 2027 (projet annuel de performances "Pouvoirs publics", pages 7-14).
// 2026 figures are the presidency's forecast of execution made in June 2026.
export const elyseeBudget = {
  source: {
    label: 'Annexe au PLF pour 2027, projet annuel de performances « Pouvoirs publics »',
    url: 'https://www.assemblee-nationale.fr/dyn/contenu/visualisation/1128255/file/PAP%202027%20-%20Pouvoirs%20publics.pdf',
  },
  dossier: PLF_2027_DOSSIER,
  /** State allocation voted in the 2026 finance act (LFI), and requested for 2027 */
  allocation: { 2026: 122_563_852, 2027: 122_563_852 },
  /** Unchanged since 2024 */
  allocationSince: 2024,
  year: 2026,
  /** Spending forecast for 2026, by item */
  spending: [
    { id: 'staff', label: 'Personnel', amount: 78_000_000 },
    { id: 'trips', label: 'Déplacements du Président', amount: 20_000_000 },
    { id: 'palace', label: 'Réceptions et événements au palais', amount: 4_003_200 },
    { id: 'operations', label: 'Fonctionnement des services', amount: 16_722_026 },
    { id: 'investment', label: 'Investissement', amount: 6_561_716 },
    { id: 'shop', label: 'Maison Élysée (boutique)', amount: 1_195_217 },
  ],
  spendingTotal: 126_482_159,
  ownRevenue: 6_387_513,
  /** Average staff (full-time equivalents) on 1 September 2026, and the ceiling */
  staff: { count: 804, asOf: '2026-09-01', ceiling: 810 },
  /** International and European trips forecast for 2026 */
  internationalTrips: { count: 44, cost: 15_276_000 },
}
