// "Gouvernement" page: the President of the Republic and the members of the Government, from the appointment
// decrees published in the Journal officiel, joined with the HATVP and the RNE.
//
// No official source publishes the composition of the Government as data, with appointment dates: the list
// below is copied by hand from the decrees. Update it at every reshuffle; the build fails when the HATVP knows
// a member of the Government that is missing here.
import { deputyPhoto } from './deputies.mjs'
import { cabinets, elyseeBudget, ministryBudgets } from './government-costs.mjs'
import { governmentPayScales } from './pay-scales.mjs'
import { senatorPhoto } from './senators.mjs'
import { normalizeName } from './lib/util.mjs'

const DECREES = {
  presidentElection: {
    title: 'Décision n° 2022-197 PDR du Conseil constitutionnel du 27 avril 2022',
    date: '2022-04-27',
    url: 'https://www.conseil-constitutionnel.fr/decision/2022/2022197PDR.htm',
  },
  pm20251010: {
    title: 'Décret du 10 octobre 2025 portant nomination du Premier ministre',
    date: '2025-10-10',
    url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000052380519',
  },
  gov20251012: {
    title: 'Décret du 12 octobre 2025 relatif à la composition du Gouvernement',
    date: '2025-10-12',
    url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052382035',
  },
  gov20260222: {
    title: 'Décret du 22 février 2026 relatif à la composition du Gouvernement',
    date: '2026-02-22',
    url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053525953',
  },
  gov20260226: {
    title: 'Décret du 26 février 2026 relatif à la composition du Gouvernement',
    date: '2026-02-26',
    url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053586369',
  },
  gov20260922: {
    title: 'Décret du 22 septembre 2026 relatif à la composition du Gouvernement',
    date: '2026-09-22',
    url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054883000',
  },
}

// Current titles, as worded in the decrees
const ECO = "l'économie, des finances et de la souveraineté industrielle, énergétique et numérique"
const ECOLOGY = 'la transition écologique, de la biodiversité et des négociations internationales sur le climat et la nature'
const HEALTH = 'la santé, des familles, de l’autonomie et des personnes handicapées'
const FOREIGN = "l'Europe et des affaires étrangères"

// `since`: first appointment in the current Government (start of the cost counter and of the filing
// deadline); `roleDecree`: decree that gave the current title, when it is a later one; `reportsTo`: surnames
// of the Prime Minister or ministers a minister delegate is placed with ("auprès de")
const MEMBERS = [
  { rank: 'president', honorific: 'M.', firstName: 'Emmanuel', lastName: 'Macron', role: 'Président de la République', since: '2022-05-14', decree: 'presidentElection' },
  { rank: 'pm', honorific: 'M.', firstName: 'Sébastien', lastName: 'Lecornu', role: 'Premier ministre', since: '2025-10-10', decree: 'pm20251010' },

  { rank: 'minister', honorific: 'M.', firstName: 'Laurent', lastName: 'Nunez', role: "Ministre de l'intérieur" },
  { rank: 'minister', honorific: 'Mme', firstName: 'Catherine', lastName: 'Vautrin', role: 'Ministre des armées et des anciens combattants' },
  { rank: 'minister', honorific: 'M.', firstName: 'Jean-Pierre', lastName: 'Farandou', role: 'Ministre du travail et des solidarités' },
  { rank: 'minister', honorific: 'Mme', firstName: 'Monique', lastName: 'Barbut', role: `Ministre de ${ECOLOGY}` },
  { rank: 'minister', honorific: 'M.', firstName: 'Gérald', lastName: 'Darmanin', role: 'Garde des sceaux, ministre de la justice' },
  { rank: 'minister', honorific: 'M.', firstName: 'Roland', lastName: 'Lescure', role: `Ministre de ${ECO}` },
  { rank: 'minister', honorific: 'M.', firstName: 'Serge', lastName: 'Papin', role: "Ministre des petites et moyennes entreprises, du commerce, de l'artisanat, du tourisme et du pouvoir d'achat" },
  { rank: 'minister', honorific: 'Mme', firstName: 'Annie', lastName: 'Genevard', role: "Ministre de l'agriculture, de l'agro-alimentaire et de la souveraineté alimentaire" },
  { rank: 'minister', honorific: 'M.', firstName: 'Edouard', lastName: 'Geffray', role: "Ministre de l'éducation nationale" },
  { rank: 'minister', honorific: 'M.', firstName: 'Jean-Noël', lastName: 'Barrot', role: `Ministre de ${FOREIGN}` },
  { rank: 'minister', honorific: 'Mme', firstName: 'Catherine', lastName: 'Pégard', role: 'Ministre de la culture', since: '2026-02-26', decree: 'gov20260226' },
  { rank: 'minister', honorific: 'Mme', firstName: 'Stéphanie', lastName: 'Rist', role: `Ministre de ${HEALTH}` },
  { rank: 'minister', honorific: 'Mme', firstName: 'Naïma', lastName: 'Moutchou', role: 'Ministre des outre-mer' },
  { rank: 'minister', honorific: 'Mme', firstName: 'Françoise', lastName: 'Gatel', role: "Ministre de l'aménagement du territoire et de la décentralisation" },
  { rank: 'minister', honorific: 'M.', firstName: 'David', lastName: 'Amiel', role: "Ministre de l'action et des comptes publics", roleDecree: 'gov20260222' },
  { rank: 'minister', honorific: 'M.', firstName: 'Philippe', lastName: 'Baptiste', role: "Ministre de l'enseignement supérieur, de la recherche et de l'espace" },
  { rank: 'minister', honorific: 'Mme', firstName: 'Marina', lastName: 'Ferrari', role: 'Ministre des sports, de la jeunesse et de la vie associative' },
  { rank: 'minister', honorific: 'M.', firstName: 'Philippe', lastName: 'Tabarot', role: 'Ministre des transports' },
  { rank: 'minister', honorific: 'M.', firstName: 'Vincent', lastName: 'Jeanbrun', role: 'Ministre de la ville et du logement' },

  { rank: 'delegate', reportsTo: ['Lecornu'], honorific: 'M.', firstName: 'Laurent', lastName: 'Panifous', role: 'Ministre délégué auprès du Premier ministre, chargé des relations avec le Parlement' },
  { rank: 'delegate', reportsTo: ['Lecornu', 'Lescure'], honorific: 'Mme', firstName: 'Maud', lastName: 'Bregeon', role: `Ministre déléguée auprès du Premier ministre, porte-parole du Gouvernement, et ministre déléguée auprès du ministre de ${ECO}, chargée de l'énergie`, roleDecree: 'gov20260226' },
  { rank: 'delegate', reportsTo: ['Lecornu'], honorific: 'Mme', firstName: 'Aurore', lastName: 'Bergé', role: "Ministre déléguée auprès du Premier ministre, chargée de l'égalité entre les femmes et les hommes et de la lutte contre les discriminations" },
  { rank: 'delegate', reportsTo: ['Nunez'], honorific: 'Mme', firstName: 'Marie-Pierre', lastName: 'Vedrenne', role: "Ministre déléguée auprès du ministre de l'intérieur, chargée de la citoyenneté", roleDecree: 'gov20260226' },
  { rank: 'delegate', reportsTo: ['Nunez'], honorific: 'M.', firstName: 'Jean-Didier', lastName: 'Berger', role: "Ministre délégué auprès du ministre de l'intérieur", since: '2026-02-26', decree: 'gov20260226' },
  { rank: 'delegate', reportsTo: ['Vautrin'], honorific: 'Mme', firstName: 'Alice', lastName: 'Rufo', role: 'Ministre déléguée auprès de la ministre des armées et des anciens combattants' },
  { rank: 'delegate', reportsTo: ['Barbut'], honorific: 'Mme', firstName: 'Catherine', lastName: 'Chabaud', role: `Ministre déléguée auprès de la ministre de ${ECOLOGY}, chargée de la mer et de la pêche` },
  { rank: 'delegate', reportsTo: ['Barbut'], honorific: 'M.', firstName: 'Mathieu', lastName: 'Lefèvre', role: `Ministre délégué auprès de la ministre de ${ECOLOGY}, chargé de la transition écologique` },
  { rank: 'delegate', reportsTo: ['Lescure'], honorific: 'M.', firstName: 'Sébastien', lastName: 'Martin', role: `Ministre délégué auprès du ministre de ${ECO}, chargé de l'industrie` },
  { rank: 'delegate', reportsTo: ['Lescure'], honorific: 'Mme', firstName: 'Anne', lastName: 'Le Hénanff', role: `Ministre déléguée auprès du ministre de ${ECO}, chargée de l'intelligence artificielle et du numérique` },
  { rank: 'delegate', reportsTo: ['Barrot'], honorific: 'M.', firstName: 'Benjamin', lastName: 'Haddad', role: `Ministre délégué auprès du ministre de ${FOREIGN}, chargé de l'Europe` },
  { rank: 'delegate', reportsTo: ['Barrot'], honorific: 'M.', firstName: 'Nicolas', lastName: 'Forissier', role: `Ministre délégué auprès du ministre de ${FOREIGN}, chargé du commerce extérieur et de l'attractivité` },
  { rank: 'delegate', reportsTo: ['Barrot'], honorific: 'Mme', firstName: 'Eléonore', lastName: 'Caroit', role: `Ministre déléguée auprès du ministre de ${FOREIGN}, chargée de la francophonie, des partenariats internationaux et des Français de l'étranger` },
  { rank: 'delegate', reportsTo: ['Farandou', 'Geffray'], honorific: 'Mme', firstName: 'Sabrina', lastName: 'Roubache', role: "Ministre déléguée auprès du ministre du travail et des solidarités et du ministre de l'éducation nationale, chargée de l'enseignement et de la formation professionnels et de l'apprentissage", since: '2026-02-26', decree: 'gov20260226' },
  { rank: 'delegate', reportsTo: ['Rist'], honorific: 'Mme', firstName: 'Camille', lastName: 'Galliard-Minier', role: `Ministre déléguée auprès de la ministre de ${HEALTH}, chargée de l'autonomie et des personnes handicapées`, since: '2026-02-26', decree: 'gov20260226' },
]

// Members of the current Government whose functions were ended by a later decree
const DEPARTURES = [
  { honorific: 'Mme', firstName: 'Amélie', lastName: 'de Montchalin', role: "Ministre de l'action et des comptes publics", since: '2025-10-12', ended: 'gov20260222' },
  { honorific: 'Mme', firstName: 'Rachida', lastName: 'Dati', role: 'Ministre de la culture', since: '2025-10-12', ended: 'gov20260226' },
  { honorific: 'Mme', firstName: 'Charlotte', lastName: 'Parmentier-Lecocq', role: `Ministre déléguée auprès de la ministre de ${HEALTH}, chargée de l'autonomie et des personnes handicapées`, since: '2025-10-12', ended: 'gov20260226' },
  { honorific: 'M.', firstName: 'Michel', lastName: 'Fournier', role: "Ministre délégué auprès de la ministre de l'aménagement du territoire et de la décentralisation, chargé de la ruralité", since: '2025-10-12', ended: 'gov20260922' },
]

// Mandates looked up in the HATVP files: liste.csv has no id_origine for these offices, so the join is on names
const HATVP_GOVERNMENT = {
  mandateType: 'gouvernement',
  isDeclaration: (g) => g.typeDeclaration?.id === 'DI' && g.qualiteMandat?.codTypeMandatFichier === 'gouvernement',
  originId: () => null,
}
const HATVP_PRESIDENT = {
  mandateType: 'president',
  isDeclaration: (g) => g.typeDeclaration?.id === 'DIA' && g.qualiteMandat?.codTypeMandatFichier === 'president',
  originId: () => null,
}

const nameKey = (lastName, firstName) => `${normalizeName(lastName)}|${normalizeName(firstName)}`

/**
 * Official portrait of a member who sits or sat in Parliament: the AN photo of a deputy of the 17th legislature,
 * else the senat.fr photo of a current or former senator. Matched on names and birth date. Photos of hatvp.fr
 * are never used (copyright, see its legal notice).
 */
function photoFinder(assemblyActors, senate) {
  const byKey = (rows) => {
    const map = new Map()
    for (const r of rows) map.set(`${nameKey(r.lastName, r.firstName)}|${r.birthDate}`, r)
    return map
  }
  const deputies = byKey(assemblyActors)
  const senators = byKey(
    senate.general.map((r) => ({
      id: r.Matricule,
      lastName: r['Nom usuel'],
      firstName: r['Prénom usuel'],
      birthDate: r['Date naissance'].slice(0, 10),
    })),
  )
  return (m) => {
    const key = `${nameKey(m.lastName, m.firstName)}|${m.birthDate}`
    const deputy = deputies.get(key)
    if (deputy) return deputyPhoto(deputy.id)
    const senator = senators.get(key)
    return senator ? senatorPhoto(senator.lastName, senator.firstName, senator.id) : ''
  }
}

/**
 * Builds the page dataset. `hatvpRows` is liste.csv, used to check that no current member of the Government is
 * missing from MEMBERS; `assemblyActors` and `senate` give the photos of members who sit or sat in Parliament;
 * `ministries` is table 6 of the finance bill (`loadMinistryBudgets`).
 */
export function buildGovernment({ hatvpFor, rneFor, hatvpRows, senate, assemblyActors, ministries }) {

  const members = MEMBERS.map((m) => {
    const decree = DECREES[m.decree ?? 'gov20251012']
    const roleDecree = DECREES[m.roleDecree ?? m.decree ?? 'gov20251012']
    return {
      id: normalizeName(`${m.lastName}${m.firstName}`),
      rank: m.rank,
      honorific: m.honorific,
      firstName: m.firstName,
      lastName: m.lastName,
      birthDate: null,
      photo: '',
      role: m.role,
      startDate: m.since ?? decree.date,
      appointedBy: decree,
      roleStart: roleDecree.date,
      roleDecree: roleDecree === decree ? null : roleDecree,
      reportsTo: [],
    }
  })
  MEMBERS.forEach((m, i) => {
    members[i].reportsTo = (m.reportsTo ?? []).map((lastName) => {
      const head = members.find((h) => h.lastName === lastName && h.rank !== 'delegate')
      if (!head) throw new Error(`Government: ${m.lastName} reports to unknown member ${lastName}`)
      return head.id
    })
  })

  // The build fails when the HATVP lists a current member of the Government missing from MEMBERS
  const known = new Set(members.map((m) => nameKey(m.lastName, m.firstName)))
  const missing = [
    ...new Set(
      hatvpRows
        .filter((r) => r.type_mandat === 'gouvernement' && !/^ancien/i.test(r.qualite))
        .map((r) => nameKey(r.nom, r.prenom))
        .filter((k) => !known.has(k)),
    ),
  ]
  if (missing.length)
    throw new Error(`Government: the HATVP lists members missing from scripts/government.mjs: ${missing.join(', ')}`)

  const president = members.filter((m) => m.rank === 'president')
  const government = members.filter((m) => m.rank !== 'president')
  const hatvp = new Map([...hatvpFor(president, HATVP_PRESIDENT), ...hatvpFor(government, HATVP_GOVERNMENT)])
  for (const m of members) {
    const { declarantBirthDate, ...h } = hatvp.get(m.id)
    m.hatvp = h
    // Liste.csv and the decrees give no birth date: it comes from the matched declaration of interests
    m.birthDate = declarantBirthDate
  }
  const rne = rneFor(members)
  for (const m of members) m.localMandates = rne.get(m.id) ?? []
  const photoOf = photoFinder(assemblyActors, senate)
  for (const m of members) m.photo = m.birthDate ? photoOf(m) : ''

  // Cabinets from the PLF annex: every row must be a member or a departure, every member but the President must
  // have a row, and the rows must add up to the annex totals
  const sum = (i) => Object.values(cabinets.byMinister).reduce((s, row) => s + row[i], 0)
  const { totals } = cabinets
  if (sum(0) !== totals.members || sum(1) !== totals.support || sum(2) !== totals.isp)
    throw new Error('Government: the cabinet rows do not add up to the annex totals')
  const departed = new Set(DEPARTURES.map((d) => d.lastName))
  for (const lastName of Object.keys(cabinets.byMinister))
    if (!members.some((m) => m.lastName === lastName) && !departed.has(lastName))
      throw new Error(`Government: cabinet of unknown member ${lastName}`)
  for (const m of members) {
    const row = cabinets.byMinister[m.lastName]
    if (!row && m.rank !== 'president') throw new Error(`Government: no cabinet row for ${m.lastName}`)
    m.cabinet = row ? { members: row[0], support: row[1], isp: row[2] } : null
  }

  const departures = DEPARTURES.map((d) => ({
    honorific: d.honorific,
    firstName: d.firstName,
    lastName: d.lastName,
    role: d.role,
    startDate: d.since,
    endedBy: DECREES[d.ended],
  }))

  console.log(`Government: ${government.length} members and the President, ${departures.length} departures`)
  console.log(
    `  HATVP: ${members.filter((m) => m.hatvp.declarations.length).length} with declarations, ` +
      `${members.filter((m) => m.hatvp.interests).length} with declaration-of-interests content`,
  )
  console.log(`  RNE: ${members.filter((m) => m.localMandates.length).length} with at least one current local mandate`)
  console.log(`  Photos: ${members.filter((m) => m.photo).length} from the Assemblée nationale or the Sénat`)

  const spent = elyseeBudget.spending.reduce((s, item) => s + item.amount, 0)
  if (spent !== elyseeBudget.spendingTotal) throw new Error('Government: the Élysée spending items do not add up')
  console.log(`  Cabinets on ${cabinets.asOf}: ${totals.members} members, ${totals.support} support staff`)

  // Per-minister rows are already on each member (`cabinet`)
  const cabinetSummary = {
    asOf: cabinets.asOf,
    source: cabinets.source,
    totals,
    byFunction: cabinets.byFunction,
    contractMembers: cabinets.contractMembers,
  }
  const budgets = ministryBudgets(ministries, members)
  console.log(`  Budgets: ${budgets.items.length} ministries in the PLF for ${budgets.year}`)
  return {
    payScales: governmentPayScales,
    members,
    departures,
    cabinets: cabinetSummary,
    elysee: elyseeBudget,
    ministryBudgets: budgets,
  }
}
