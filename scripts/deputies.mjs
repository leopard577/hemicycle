// "Députés" page: Assemblée nationale open data (17th legislature), joined with the HATVP and the RNE
import AdmZip from 'adm-zip'
import { DEPUTY_SPECIAL_ALLOWANCES, deputyPayScales } from './pay-scales.mjs'
import { asArray, download, text } from './lib/util.mjs'

const SOURCE =
  'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip'

// Group order from the left to the right of the hemicycle
const GROUP_ORDER = ['LFI-NFP', 'GDR', 'ECOS', 'SOC', 'LIOT', 'DEM', 'EPR', 'HOR', 'DR', 'UDDPLR', 'RN', 'NI']

// Mandate looked up in the HATVP files; id_origine is the AN id without "PA"
const HATVP_MANDATE = { mandateType: 'depute', xmlMandateLabel: 'Député', originId: (d) => d.id.replace('PA', '') }

const isActive = (m) => !m.dateFin

/** Downloads the AN archive: actors and organs (groups, committees…) */
export async function loadDeputies() {
  console.log('Downloading Assemblée nationale…')
  const zip = new AdmZip(Buffer.from(await (await download(SOURCE)).arrayBuffer()))
  const organs = new Map()
  const actors = []
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory || !entry.entryName.endsWith('.json')) continue
    const json = JSON.parse(entry.getData().toString('utf8'))
    if (json.organe) organs.set(json.organe.uid, json.organe)
    else if (json.acteur) actors.push(json.acteur)
  }
  return { organs, actors }
}

/** Special allowances owed for the roles held (President, quaestor, committee chair…) */
function specialAllowances(activeMandates, organLabel) {
  const result = []
  for (const m of activeMandates) {
    const role = m.infosQualite?.codeQualite
    const organ = organLabel(m.organes.organeRef)
    const match = DEPUTY_SPECIAL_ALLOWANCES.find(
      (r) =>
        r.organType === m.typeOrgane &&
        r.role === role &&
        (!r.organ || (r.organ instanceof RegExp ? r.organ.test(organ) : r.organ === organ)),
    )
    if (match) result.push({ label: match.label, body: organ, amount: match.amount })
  }
  return result
}

/** Builds the page dataset from the AN archive and the shared sources */
export function buildDeputies({ organs, actors }, { hatvpFor, rneFor }) {
  const organLabel = (ref) => organs.get(Array.isArray(ref) ? ref[0] : ref)?.libelle ?? ref
  const groups = new Map()
  const deputies = []

  for (const a of actors) {
    const mandates = asArray(a.mandats?.mandat)
    const assembly = mandates.find((m) => m.typeOrgane === 'ASSEMBLEE' && m.legislature === '17' && isActive(m))
    if (!assembly) continue

    const groupMandate = mandates
      .filter((m) => m.typeOrgane === 'GP' && isActive(m))
      .sort((x, y) => (y.dateDebut ?? '').localeCompare(x.dateDebut ?? ''))[0]
    const group = groupMandate && organs.get(groupMandate.organes.organeRef)
    if (group && !groups.has(group.uid)) {
      groups.set(group.uid, {
        id: group.uid,
        abbrev: group.libelleAbrev,
        label: group.libelle,
        color: group.couleurAssociee ?? '#8D949A',
      })
    }

    const party = mandates.find((m) => m.typeOrgane === 'PARPOL' && isActive(m))
    const committees = mandates
      .filter((m) => m.typeOrgane === 'COMPER' && isActive(m))
      .map((m) => ({ label: organLabel(m.organes.organeRef), role: m.infosQualite?.libQualiteSex ?? 'Membre' }))
    // The same committee can appear several times (successive mandates)
    const uniqueCommittees = [...new Map(committees.map((c) => [c.label, c])).values()]

    const addresses = asArray(a.adresses?.adresse)
    const findContact = (type) => text(addresses.find((ad) => ad.typeLibelle === type)?.valElec)

    const id = a.uid['#text']
    const ident = a.etatCivil.ident
    const place = assembly.election?.lieu ?? {}
    deputies.push({
      id,
      honorific: ident.civ,
      firstName: ident.prenom,
      lastName: ident.nom,
      sortName: ident.alpha,
      birthDate: text(a.etatCivil.infoNaissance?.dateNais),
      birthPlace: text(a.etatCivil.infoNaissance?.villeNais),
      profession: text(a.profession?.libelleCourant)?.replace(/^\(\d+\)\s*-\s*/, '') ?? null,
      groupId: group?.uid ?? null,
      groupRole: groupMandate?.infosQualite?.libQualiteSex ?? null,
      party: party ? organLabel(party.organes.organeRef) : null,
      department: text(place.departement),
      departmentCode: text(place.numDepartement),
      constituency: text(place.numCirco),
      region: text(place.region),
      startDate: assembly.mandature?.datePriseFonction ?? assembly.dateDebut,
      firstTerm: assembly.mandature?.premiereElection === '1',
      seat: Number(assembly.mandature?.placeHemicycle) || null,
      committees: uniqueCommittees,
      email: findContact('Mèl'),
      website: findContact('Site internet'),
      twitter: findContact('Twitter'),
      hatvp: text(a.uri_hatvp),
      photo: `https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre/${id.replace('PA', '')}.jpg`,
      specialAllowances: specialAllowances(mandates.filter(isActive), organLabel),
      staffCount: asArray(assembly.collaborateurs?.collaborateur).length,
    })
  }

  const hatvp = hatvpFor(deputies, HATVP_MANDATE)
  // Fall back to the HATVP URL given by the AN when the HATVP list has none
  for (const d of deputies) d.hatvp = { ...hatvp.get(d.id), page: hatvp.get(d.id).page ?? d.hatvp }
  const rne = rneFor(deputies)
  for (const d of deputies) d.localMandates = rne.get(d.id) ?? []

  const rank = (abbrev) => {
    const i = GROUP_ORDER.indexOf(abbrev)
    return i === -1 ? GROUP_ORDER.length : i
  }
  const sortedGroups = [...groups.values()].sort((x, y) => rank(x.abbrev) - rank(y.abbrev))
  const groupRank = new Map(sortedGroups.map((g, i) => [g.id, i]))
  deputies.sort(
    (x, y) =>
      (groupRank.get(x.groupId) ?? 99) - (groupRank.get(y.groupId) ?? 99) || (x.seat ?? 9999) - (y.seat ?? 9999),
  )

  console.log(`Deputies: ${deputies.length} deputies, ${sortedGroups.length} groups`)
  console.log(
    `  HATVP: ${deputies.filter((d) => d.hatvp.declarations.length).length} with declarations, ` +
      `${deputies.filter((d) => d.hatvp.interests).length} with declaration-of-interests content, ` +
      `${deputies.filter((d) => d.specialAllowances.length).length} with a special allowance`,
  )
  console.log(
    `  RNE: ${deputies.filter((d) => d.localMandates.length).length} with at least one current local mandate, ` +
      `${deputies.filter((d) => d.hatvp.otherMandates.length).length} with another office declared to the HATVP`,
  )

  return { payScales: deputyPayScales, groups: sortedGroups, members: deputies }
}
