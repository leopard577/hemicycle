// Télécharge l'open data de l'Assemblée nationale (17e législature) et
// produit un JSON compact consommé par le front : public/data/deputes.json
import AdmZip from 'adm-zip'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { baremes, indemnitesSpeciales, loadHatvp } from './hatvp.mjs'

const SOURCE =
  'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'deputes.json')

// Ordre des groupes de la gauche vers la droite de l'hémicycle
const GROUP_ORDER = ['LFI-NFP', 'GDR', 'ECOS', 'SOC', 'LIOT', 'DEM', 'EPR', 'HOR', 'DR', 'UDDPLR', 'RN', 'NI']

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v])
const text = (v) => (v == null || typeof v === 'object' ? null : String(v))
const isActive = (m) => !m.dateFin

console.log('Téléchargement…')
const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`HTTP ${res.status} sur ${SOURCE}`)
const zip = new AdmZip(Buffer.from(await res.arrayBuffer()))

const organes = new Map()
const acteurs = []
for (const entry of zip.getEntries()) {
  if (entry.isDirectory || !entry.entryName.endsWith('.json')) continue
  const json = JSON.parse(entry.getData().toString('utf8'))
  if (json.organe) organes.set(json.organe.uid, json.organe)
  else if (json.acteur) acteurs.push(json.acteur)
}

const organeLabel = (ref) => organes.get(Array.isArray(ref) ? ref[0] : ref)?.libelle ?? ref
const hatvpFor = await loadHatvp()

const groupes = new Map()
const deputes = []

for (const a of acteurs) {
  const mandats = asArray(a.mandats?.mandat)
  const assemblee = mandats.find((m) => m.typeOrgane === 'ASSEMBLEE' && m.legislature === '17' && isActive(m))
  if (!assemblee) continue

  const gpMandat = mandats
    .filter((m) => m.typeOrgane === 'GP' && isActive(m))
    .sort((x, y) => (y.dateDebut ?? '').localeCompare(x.dateDebut ?? ''))[0]
  const gp = gpMandat && organes.get(gpMandat.organes.organeRef)
  if (gp && !groupes.has(gp.uid)) {
    groupes.set(gp.uid, {
      id: gp.uid,
      abrev: gp.libelleAbrev,
      libelle: gp.libelle,
      couleur: gp.couleurAssociee ?? '#8D949A',
    })
  }

  const parti = mandats.find((m) => m.typeOrgane === 'PARPOL' && isActive(m))
  const commissions = mandats
    .filter((m) => m.typeOrgane === 'COMPER' && isActive(m))
    .map((m) => ({ libelle: organeLabel(m.organes.organeRef), qualite: m.infosQualite?.libQualiteSex ?? 'Membre' }))
  // Une même commission peut apparaître plusieurs fois (mandats successifs)
  const uniqueCommissions = [...new Map(commissions.map((c) => [c.libelle, c])).values()]

  const adresses = asArray(a.adresses?.adresse)
  const findElec = (type) => text(adresses.find((ad) => ad.typeLibelle === type)?.valElec)

  const id = a.uid['#text']
  const ident = a.etatCivil.ident
  const lieu = assemblee.election?.lieu ?? {}
  const depute = {
    id,
    civ: ident.civ,
    prenom: ident.prenom,
    nom: ident.nom,
    alpha: ident.alpha,
    dateNais: text(a.etatCivil.infoNaissance?.dateNais),
    villeNais: text(a.etatCivil.infoNaissance?.villeNais),
    profession: text(a.profession?.libelleCourant)?.replace(/^\(\d+\)\s*-\s*/, '') ?? null,
    groupeId: gp?.uid ?? null,
    qualiteGroupe: gpMandat?.infosQualite?.libQualiteSex ?? null,
    parti: parti ? organeLabel(parti.organes.organeRef) : null,
    departement: text(lieu.departement),
    numDepartement: text(lieu.numDepartement),
    numCirco: text(lieu.numCirco),
    region: text(lieu.region),
    dateDebut: assemblee.mandature?.datePriseFonction ?? assemblee.dateDebut,
    premiereElection: assemblee.mandature?.premiereElection === '1',
    placeHemicycle: Number(assemblee.mandature?.placeHemicycle) || null,
    commissions: uniqueCommissions,
    email: findElec('Mèl'),
    site: findElec('Site internet'),
    twitter: findElec('Twitter'),
    hatvp: text(a.uri_hatvp),
    photo: `https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre/${id.replace('PA', '')}.jpg`,
    indemnitesSpeciales: indemnitesSpeciales(mandats.filter(isActive), organeLabel),
    nbCollaborateurs: asArray(assemblee.collaborateurs?.collaborateur).length,
  }
  deputes.push(depute)
}

const hatvp = hatvpFor(deputes)
// Repli sur l'URL HATVP fournie par l'AN quand la liste HATVP n'en donne pas
for (const d of deputes) d.hatvp = { ...hatvp.get(d.id), page: hatvp.get(d.id).page ?? d.hatvp }

const rank = (abrev) => {
  const i = GROUP_ORDER.indexOf(abrev)
  return i === -1 ? GROUP_ORDER.length : i
}
const sortedGroupes = [...groupes.values()].sort((x, y) => rank(x.abrev) - rank(y.abrev))
const groupRank = new Map(sortedGroupes.map((g, i) => [g.id, i]))
deputes.sort(
  (x, y) =>
    (groupRank.get(x.groupeId) ?? 99) - (groupRank.get(y.groupeId) ?? 99) ||
    (x.placeHemicycle ?? 9999) - (y.placeHemicycle ?? 9999),
)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), baremes, groupes: sortedGroupes, deputes }))
console.log(`${deputes.length} députés, ${sortedGroupes.length} groupes → ${OUT}`)
console.log(
  `HATVP : ${deputes.filter((d) => d.hatvp.declarations.length).length} avec déclarations, ` +
    `${deputes.filter((d) => d.hatvp.interets).length} avec contenu d'intérêts, ` +
    `${deputes.filter((d) => d.indemnitesSpeciales.length).length} avec indemnité spéciale`,
)
