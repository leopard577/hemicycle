// "Sénateurs" page: Sénat open data, joined with the HATVP and the RNE
import { SENATOR_SPECIAL_ALLOWANCES, senatorPayScales } from './pay-scales.mjs'
import { download, parseQuotedCsv } from './lib/util.mjs'

const SENAT = 'https://www.senat.fr'
// Current senators: group, seat number, photo, page (JSON used by senat.fr)
const SENATORS_URL = `${SENAT}/api-senat/senateurs.json`
// data.senat.fr exports, cp1252-encoded CSV
const CSV_BASE = 'https://data.senat.fr/data/senateurs'
const CSV_FILES = {
  general: 'ODSEN_GENERAL', // birth date, profession, e-mail, Bureau role
  terms: 'ODSEN_ELUSEN', // senatorial terms, with start and end dates
  committees: 'ODSEN_CUR_COMS', // current committee memberships and roles
  bodies: 'ODSEN_CUR_OFFDEL', // current delegations and offices (OPECST…)
  groups: 'ODSEN_HISTOGROUPES', // group memberships and roles, past and current
}

// Group order from the left to the right of the hemicycle, by group code
const GROUP_ORDER = ['CRC', 'GEST', 'SOC', 'LREM', 'RDSE', 'UC', 'RTLI', 'UMP', 'UNT', 'NI']

// The Sénat publishes no group colour: these are chosen by the app, close to the usual party colours
const GROUP_COLORS = {
  CRC: '#B71C1C',
  GEST: '#43A047',
  SOC: '#EC6FA3',
  LREM: '#F2B705',
  RDSE: '#E58A2C',
  UC: '#5DA9E9',
  RTLI: '#4DB6AC',
  UMP: '#1F4E9B',
  UNT: '#3B2A63',
  NI: '#8D949A',
}

// senat.fr photo of any senator, current or former: "/senimg/lecornu_sebastien19265t_carre.jpg"
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '_')
    .replace(/^_|_$/g, '')
export const senatorPhoto = (lastName, firstName, matricule) =>
  `${SENAT}/senimg/${slug(lastName)}_${slug(firstName)}${matricule.toLowerCase()}_carre.jpg`

// Group membership type in senateurs.json
const AFFILIATION = { A: 'Apparenté', R: 'Rattaché administrativement' }

// Mandate looked up in the HATVP files; id_origine is the Sénat matricule
const HATVP_MANDATE = {
  mandateType: 'senateur',
  isDeclaration: (g) => g.typeDeclaration?.id === 'DIA' && g.qualiteMandat?.labelTypeMandat === 'Sénateur',
  originId: (s) => s.id,
}

// "2026-10-01 00:00:00.0" → "2026-10-01"
const isoDate = (v) => (v ? v.slice(0, 10) : null)

/** Downloads the Sénat list of current senators and the data.senat.fr exports */
export async function loadSenators() {
  console.log('Downloading Sénat…')
  const decoder = new TextDecoder('windows-1252')
  const [senators, ...tables] = await Promise.all([
    download(SENATORS_URL).then((r) => r.json()),
    ...Object.values(CSV_FILES).map(async (name) =>
      parseQuotedCsv(decoder.decode(await (await download(`${CSV_BASE}/${name}.csv`)).arrayBuffer())),
    ),
  ])
  return { senators, ...Object.fromEntries(Object.keys(CSV_FILES).map((k, i) => [k, tables[i]])) }
}

const byMatricule = (rows) => {
  const map = new Map()
  for (const r of rows) map.set(r.Matricule, [...(map.get(r.Matricule) ?? []), r])
  return map
}

/** Builds the page dataset from the Sénat sources and the shared ones */
export function buildSenators({ senators, general, terms, committees, bodies, groups }, { hatvpFor, rneFor }) {
  const generalById = new Map(general.map((r) => [r.Matricule, r]))
  const termsById = byMatricule(terms.filter((r) => !r['Date de fin de mandat']))
  const committeesById = byMatricule(committees.filter((r) => !r["Fin d'appartenance"]))
  const bodiesById = byMatricule(bodies.filter((r) => !r["Fin d'appartenance"]))
  const groupRolesById = byMatricule(
    groups.filter((r) => !r["Date de fin d'appartenance"] && !r['Date de fin de la fonction']),
  )

  // Roles that carry a function allowance, for one senator, by source file
  const roles = (id) => ({
    bureau: [generalById.get(id)?.['Fonction au Bureau du Sénat']].filter(Boolean).map((role) => ({ role, body: 'Bureau du Sénat' })),
    group: (groupRolesById.get(id) ?? []).map((r) => ({ role: r['Nom court fonction'], body: r['Nom court du groupe politique'] })),
    committee: (committeesById.get(id) ?? [])
      .filter((r) => r['Type commission'] === 'Commission permanente' && !r['Fin de fonction'])
      .map((r) => ({ role: r.Fonction, body: r['Nom commission'] })),
    delegation: (bodiesById.get(id) ?? [])
      .filter((r) => r['Type commission'] === 'Délégation' && !r['Fin de fonction'])
      .map((r) => ({ role: r.Fonction, body: r['Nom organisme'] })),
    opecst: (bodiesById.get(id) ?? [])
      .filter((r) => /choix scientifiques et technologiques/i.test(r['Nom organisme']) && !r['Fin de fonction'])
      .map((r) => ({ role: r.Fonction, body: r['Nom organisme'] })),
  })

  const specialAllowances = (id) => {
    const held = roles(id)
    return SENATOR_SPECIAL_ALLOWANCES.flatMap((rule) =>
      held[rule.source].filter((h) => rule.role.test(h.role)).map((h) => ({ label: rule.label, body: h.body, amount: rule.amount })),
    )
  }

  const groupsById = new Map()
  const members = senators.map((s) => {
    const g = s.groupe
    if (g && !groupsById.has(g.code))
      groupsById.set(g.code, { id: g.code, abbrev: g.libelleCourt, label: g.libelle, color: GROUP_COLORS[g.code] ?? '#8D949A' })
    const row = generalById.get(s.matricule) ?? {}
    // A senator holds one current term; the most recent start wins if the export lists several
    const term = (termsById.get(s.matricule) ?? []).sort((a, b) =>
      b['Date de début de mandat'].localeCompare(a['Date de début de mandat']),
    )[0]
    const groupRole = (groupRolesById.get(s.matricule) ?? [])[0]?.['Nom court fonction']
    const email = row['Courrier électronique']
    return {
      id: s.matricule,
      honorific: s.civilite,
      firstName: s.prenom,
      lastName: s.nom,
      sortName: s.tri,
      birthDate: isoDate(row['Date naissance']),
      profession: row['Description de la profession'] || null,
      groupId: g?.code ?? null,
      groupRole: groupRole && groupRole !== 'Membre' ? groupRole : null,
      affiliation: AFFILIATION[g?.codeTypeAppartenance] ?? null,
      constituency: s.circonscription?.libelle ?? null,
      constituencyCode: s.circonscription?.code ?? null,
      series: s.serie ?? null,
      bureauRole: row['Fonction au Bureau du Sénat'] || null,
      startDate: isoDate(term?.['Date de début de mandat']),
      // A senator without a seat (a minister, for instance) has `siege: 0`
      seat: s.siege || null,
      committees: [...new Map(
        (committeesById.get(s.matricule) ?? [])
          // The export lists "Aucune" for senators outside any committee (the President of the Sénat…)
          .filter((c) => c['Nom commission'] !== 'Aucune')
          .map((c) => [c['Nom commission'], { label: c['Nom commission'], role: c.Fonction || 'Membre' }]),
      ).values()],
      email: email && email !== 'Non public' ? email : null,
      twitter: s.twitter || null,
      senatPage: s.url ? SENAT + s.url : null,
      photo: s.urlAvatar ? SENAT + s.urlAvatar : '',
      specialAllowances: specialAllowances(s.matricule),
    }
  })

  const missingStart = members.filter((m) => !m.startDate)
  if (missingStart.length) throw new Error(`Sénat: no current term for ${missingStart.map((m) => m.id).join(', ')}`)

  const hatvp = hatvpFor(members, HATVP_MANDATE)
  for (const m of members) {
    const { declarantBirthDate: _, ...h } = hatvp.get(m.id)
    m.hatvp = h
  }
  const rne = rneFor(members)
  for (const m of members) m.localMandates = rne.get(m.id) ?? []

  const rank = (code) => {
    const i = GROUP_ORDER.indexOf(code)
    return i === -1 ? GROUP_ORDER.length : i
  }
  const sortedGroups = [...groupsById.values()].sort((x, y) => rank(x.id) - rank(y.id))
  members.sort((x, y) => rank(x.groupId) - rank(y.groupId) || (x.seat ?? 9999) - (y.seat ?? 9999))

  console.log(`Senators: ${members.length} senators, ${sortedGroups.length} groups`)
  console.log(
    `  HATVP: ${members.filter((m) => m.hatvp.declarations.length).length} with declarations, ` +
      `${members.filter((m) => m.hatvp.interests).length} with declaration-of-interests content, ` +
      `${members.filter((m) => m.specialAllowances.length).length} with a function allowance`,
  )
  console.log(
    `  RNE: ${members.filter((m) => m.localMandates.length).length} with at least one current local mandate, ` +
      `${members.filter((m) => m.hatvp.otherMandates.length).length} with another office declared to the HATVP`,
  )

  return { payScales: senatorPayScales, groups: sortedGroups, members }
}
