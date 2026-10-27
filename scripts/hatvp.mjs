// Données de la HATVP (Haute Autorité pour la transparence de la vie publique)
// et barèmes officiels de rémunération des députés.
import { XMLParser } from 'fast-xml-parser'

const LISTE_URL = 'https://www.hatvp.fr/livraison/opendata/liste.csv'
const DECLARATIONS_URL = 'https://www.hatvp.fr/livraison/merge/declarations.xml'
const HATVP_BASE = 'https://www.hatvp.fr'

// Source : Assemblée nationale, fiche de synthèse n° 7 « La situation matérielle du député »
// (mise à jour janvier 2026). Montants mensuels en euros.
export const baremes = {
  source:
    'https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute',
  miseAJour: '2026-01',
  indemnite: { base: 5931.95, residence: 177.96, fonction: 1527.48, brut: 7637.39, net: 5953.34 },
  dotationFonctionnement: 7238.04,
  creditCollaborateurs: 11463,
  maxCollaborateurs: 5,
  plafondCumul: 2965.98,
  // SMIC mensuel 35 h au 1er juin 2026 (revalorisation automatique, arrêté du 22 mai 2026)
  smic: {
    brut: 1867.02,
    net: 1477.93,
    miseAJour: '2026-06',
    source: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2300',
  },
}

const TYPE_MANDAT = {
  senateur: 'Sénat',
  europe: 'Parlement européen',
  gouvernement: 'Gouvernement',
  commune: 'Commune',
  epci: 'Intercommunalité',
  departement: 'Département',
  region: 'Région',
  ctsp: 'Collectivité à statut particulier',
  president: 'Présidence de la République',
  autre: 'Autre fonction',
}

// Indemnités spéciales (brut mensuel), indexées par [type d'organe, organe, qualité]
const INDEMNITES_SPECIALES = [
  { typeOrgane: 'BUREAU', organe: "Bureau de l'Assemblée", qualite: 'Président', libelle: "Président de l'Assemblée", montant: 7698.5 },
  { typeOrgane: 'BUREAU', organe: "Bureau de l'Assemblée", qualite: 'Questeur', libelle: 'Questeur', montant: 5300.36 },
  { typeOrgane: 'BUREAU', organe: "Bureau de l'Assemblée", qualite: 'Vice-Président', libelle: "Vice-président de l'Assemblée", montant: 1099.79 },
  { typeOrgane: 'BUREAU', organe: "Bureau de l'Assemblée", qualite: 'Secrétaire', libelle: 'Secrétaire du Bureau', montant: 733.19 },
  { typeOrgane: 'COMPER', qualite: 'Président', libelle: 'Président de commission permanente', montant: 931.76 },
  { typeOrgane: 'COMPER', qualite: 'Rapporteur général', libelle: 'Rapporteur général', montant: 931.76 },
  { typeOrgane: 'OFFPAR', organe: /choix scientifiques et technologiques/i, qualite: 'Président', libelle: "Président de l'OPECST", montant: 931.76 },
]

export function indemnitesSpeciales(mandatsActifs, organeLabel) {
  const result = []
  for (const m of mandatsActifs) {
    const qualite = m.infosQualite?.codeQualite
    const organe = organeLabel(m.organes.organeRef)
    const match = INDEMNITES_SPECIALES.find(
      (r) =>
        r.typeOrgane === m.typeOrgane &&
        r.qualite === qualite &&
        (!r.organe || (r.organe instanceof RegExp ? r.organe.test(organe) : r.organe === organe)),
    )
    if (match) result.push({ libelle: match.libelle, organe, montant: match.montant })
  }
  return result
}

const DOC_LABELS = {
  dia: "Déclaration d'intérêts et d'activités",
  diam: "Déclaration d'intérêts et d'activités (modification)",
  dsp: 'Déclaration de situation patrimoniale',
  dspm: 'Déclaration de situation patrimoniale (modification)',
  dspfm: 'Déclaration de situation patrimoniale de fin de mandat',
}

const NON_PUBLIE = /\[Données non publiées\]/g

const clean = (v) => {
  if (v == null || typeof v === 'object') return null
  const s = String(v).replace(NON_PUBLIE, '').replace(/\s+/g, ' ').trim()
  return s || null
}

const parseAmount = (v) => {
  const s = clean(v)
  if (!s) return null
  const n = Number(s.replace(/[\s €]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const asArray = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v])

// "dd/mm/yyyy[ hh:mm:ss]" → "yyyy-mm-dd"
const frToIso = (v) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(v ?? '')
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

export const normalizeName = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')

// "Lucas-Lundy" → {"LUCAS", "LUNDY", "LUCASLUNDY"} : les noms d'usage diffèrent souvent entre AN et HATVP
const nameTokens = (...parts) =>
  new Set(
    parts
      .flatMap((p) => [p, ...(p ?? '').split(/[^\p{L}]+/u)])
      .map(normalizeName)
      .filter((t) => t.length >= 2),
  )

const intersects = (a, b) => [...a].some((t) => b.has(t))

function parseCsv(text) {
  const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
  const cols = header.split(';')
  return lines.map((line) => {
    const values = line.split(';')
    return Object.fromEntries(cols.map((c, i) => [c, values[i] ?? '']))
  })
}

function revenus(item, { intitule, organisme }) {
  return {
    intitule: clean(item[intitule]),
    organisme: organisme ? clean(item[organisme]) : null,
    debut: clean(item.dateDebut),
    fin: clean(item.dateFin),
    brutNet: clean(item.remuneration?.brutNet),
    montants: asArray(item.remuneration?.montant?.[0]?.montant ?? item.remuneration?.montant)
      .map((m) => ({ annee: Number(m.annee), montant: parseAmount(m.montant) }))
      .filter((m) => Number.isFinite(m.annee)),
  }
}

// null = rubrique absente, [] = « néant » déclaré
function section(decl, key, map) {
  const dto = decl[key]
  if (!dto) return null
  if (String(dto.neant) === 'true') return []
  return asArray(dto.items?.items).map(map)
}

function extractInterets(decl) {
  return {
    dateDepot: frToIso(decl.dateDepot),
    modificative: String(decl.general?.declarationModificative) === 'true',
    activites: section(decl, 'activProfCinqDerniereDto', (i) =>
      revenus(i, { intitule: 'description', organisme: 'employeur' }),
    ),
    mandats: section(decl, 'mandatElectifDto', (i) => revenus(i, { intitule: 'descriptionMandat', organisme: null })),
    consultant: section(decl, 'activConsultantDto', (i) =>
      revenus(i, { intitule: 'description', organisme: 'nomEmployeur' }),
    ),
    dirigeant: section(decl, 'participationDirigeantDto', (i) =>
      revenus(i, { intitule: 'activite', organisme: 'nomSociete' }),
    ),
    participations: section(decl, 'participationFinanciereDto', (i) => ({
      societe: clean(i.nomSociete) ?? 'Société (nom non publié)',
      evaluation: parseAmount(i.evaluation),
      capitalDetenu: clean(i.capitalDetenu),
      nombreParts: clean(i.nombreParts),
      remuneration: clean(i.remuneration),
    })),
  }
}

async function download(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`)
  return res.text()
}

/**
 * Renvoie une fonction (deputes) => Map(id député → données HATVP).
 * Les statuts viennent de liste.csv (lié par identifiant AN), le contenu des
 * déclarations d'intérêts du XML consolidé (lié par nom + date de naissance).
 * Les déclarations de patrimoine des parlementaires ne sont pas publiées en
 * ligne (consultation en préfecture uniquement, art. LO 135-2 du code électoral) :
 * seul leur statut de dépôt est repris.
 */
export async function loadHatvp() {
  console.log('Téléchargement HATVP…')
  const [csv, xml] = await Promise.all([download(LISTE_URL), download(DECLARATIONS_URL)])

  // Lignes indexées par identifiant AN, ou par nom + prénom quand id_origine est vide
  const rowsByKey = new Map()
  // Toutes les lignes d'une même personne partagent url_dossier, quel que soit le mandat :
  // c'est ce qui révèle les autres fonctions déclarées (sénateur, maire, président d'EPCI…)
  const autresByDossier = new Map()
  const push = (map, key, r) => map.set(key, [...(map.get(key) ?? []), r])
  for (const r of parseCsv(csv)) {
    if (r.type_mandat === 'depute') push(rowsByKey, r.id_origine || `nom:${normalizeName(r.nom)}${normalizeName(r.prenom)}`, r)
    else if (r.url_dossier) push(autresByDossier, r.url_dossier, r)
  }

  const parser = new XMLParser({
    parseTagValue: false,
    isArray: (name, _path, isLeaf) => name === 'declaration' || (name === 'montant' && !isLeaf),
  })
  const declarations = asArray(parser.parse(xml).declarations?.declaration)

  // Déclarations d'intérêts de députés. Une même personne (nom + naissance) en a
  // souvent plusieurs : la plus récente (DIA ou DIAM) reprend la déclaration complète.
  const declarants = new Map()
  for (const d of declarations) {
    const g = d.general ?? {}
    if (g.typeDeclaration?.id !== 'DIA' || g.qualiteMandat?.labelTypeMandat !== 'Député') continue
    const birth = frToIso(g.declarant?.dateNaissance)
    const key = `${normalizeName(g.declarant?.nom)}|${normalizeName(g.declarant?.prenom)}|${birth}`
    const dateDepot = frToIso(d.dateDepot) ?? ''
    const current = declarants.get(key)
    if (current && current.dateDepot >= dateDepot) continue
    declarants.set(key, {
      key,
      birth,
      dateDepot,
      // Nom et prénom sont parfois inversés dans les déclarations
      tokens: nameTokens(g.declarant?.nom, g.declarant?.prenom),
      decl: d,
    })
  }
  const candidates = [...declarants.values()]

  // Rapprochement du plus sûr au moins sûr ; une déclaration n'est attribuée qu'une fois
  const RULES = [
    // même naissance, nom et prénom concordants
    (dep, c) => c.birth === dep.dateNais && intersects(dep.nomTokens, c.tokens) && intersects(dep.prenomTokens, c.tokens),
    // même naissance et même nom, prénom d'usage différent (Jimmy / Jean-Michel)
    (dep, c) => c.birth === dep.dateNais && intersects(dep.nomTokens, c.tokens),
    // nom et prénom concordants, date de naissance mal saisie d'un côté
    (dep, c) => intersects(dep.nomTokens, c.tokens) && intersects(dep.prenomTokens, c.tokens),
  ]

  return (deputes) => {
    const pending = deputes.map((d) => ({ ...d, nomTokens: nameTokens(d.nom), prenomTokens: nameTokens(d.prenom) }))
    const claimed = new Set()
    const interetsById = new Map()
    for (const rule of RULES) {
      for (const dep of pending) {
        if (interetsById.has(dep.id)) continue
        const matches = candidates.filter((c) => !claimed.has(c.key) && rule(dep, c))
        if (matches.length !== 1) continue
        claimed.add(matches[0].key)
        interetsById.set(dep.id, matches[0].decl)
      }
    }

    return new Map(deputes.map((depute) => [depute.id, hatvpDepute(depute, interetsById.get(depute.id))]))
  }

  function hatvpDepute(depute, interets) {
    const rows =
      rowsByKey.get(depute.id.replace('PA', '')) ??
      rowsByKey.get(`nom:${normalizeName(depute.nom)}${normalizeName(depute.prenom)}`) ??
      []
    return {
      page: rows[0]?.url_dossier ? HATVP_BASE + rows[0].url_dossier : null,
      declarations: rows
        .map((r) => ({
          type: r.type_document,
          libelle: DOC_LABELS[r.type_document] ?? r.type_document,
          dateDepot: r.date_depot || null,
          datePublication: r.date_publication || null,
          statut: r.statut_publication || null,
        }))
        .sort((a, b) => (b.dateDepot ?? '').localeCompare(a.dateDepot ?? '')),
      interets: interets ? extractInterets(interets) : null,
      autresMandats: autresMandats(rows[0]?.url_dossier),
    }
  }

  // Une entrée par fonction, avec la date du dépôt le plus récent
  function autresMandats(dossier) {
    const parFonction = new Map()
    for (const r of autresByDossier.get(dossier) ?? []) {
      const key = `${r.type_mandat}|${r.qualite}`
      const current = parFonction.get(key)
      if (current && (current.dernierDepot ?? '') >= r.date_depot) continue
      parFonction.set(key, {
        type: r.type_mandat,
        institution: TYPE_MANDAT[r.type_mandat] ?? r.type_mandat,
        qualite: r.qualite || null,
        dernierDepot: r.date_depot || null,
      })
    }
    return [...parFonction.values()].sort((a, b) => (b.dernierDepot ?? '').localeCompare(a.dernierDepot ?? ''))
  }
}
