// HATVP data (Haute Autorité pour la transparence de la vie publique), shared by every kind of public
// official: list of declarations (CSV) and content of declarations of interests (XML).
import { XMLParser } from 'fast-xml-parser'
import { asArray, download, frToIso, intersects, nameTokens, normalizeName, parseCsv } from './util.mjs'

const LIST_URL = 'https://www.hatvp.fr/livraison/opendata/liste.csv'
const DECLARATIONS_URL = 'https://www.hatvp.fr/livraison/merge/declarations.xml'
const HATVP_BASE = 'https://www.hatvp.fr'

// Values of `type_mandat` in liste.csv
const MANDATE_TYPES = {
  depute: 'Assemblée nationale',
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

const DOCUMENT_LABELS = {
  dia: "Déclaration d'intérêts et d'activités",
  diam: "Déclaration d'intérêts et d'activités (modification)",
  di: "Déclaration d'intérêts",
  dim: "Déclaration d'intérêts (modification)",
  dsp: 'Déclaration de situation patrimoniale',
  dspm: 'Déclaration de situation patrimoniale (modification)',
  dspfm: 'Déclaration de situation patrimoniale de fin de mandat',
}
const INTEREST_DOCUMENTS = ['dia', 'diam', 'di', 'dim']

// Redactions, full ("[Données non publiées]") or partial ("SCI [Données non publiées]"), are kept as is: the
// HATVP legal notice requires reproduced information to stay intact. null = field left empty
const clean = (v) => {
  if (v == null || typeof v === 'object') return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s || null
}

const parseAmount = (v) => {
  const s = clean(v)
  if (!s) return null
  const n = Number(s.replace(/[\s €]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// An amount that is not a number keeps its text as published ("[Données non publiées]"…), for display
const amountText = (v) => (parseAmount(v) === null ? clean(v) : null)

function income(item, { title, organization }) {
  return {
    title: clean(item[title]),
    organization: organization ? clean(item[organization]) : null,
    start: clean(item.dateDebut),
    end: clean(item.dateFin),
    grossNet: clean(item.remuneration?.brutNet),
    amounts: asArray(item.remuneration?.montant?.[0]?.montant ?? item.remuneration?.montant)
      .map((m) => ({ year: Number(m.annee), amount: parseAmount(m.montant), text: amountText(m.montant) }))
      .filter((m) => Number.isFinite(m.year)),
  }
}

// null = section missing, [] = "néant" (none) declared
function section(decl, key, map) {
  const dto = decl[key]
  if (!dto) return null
  if (String(dto.neant) === 'true') return []
  return asArray(dto.items?.items).map(map)
}

function extractInterests(decl) {
  return {
    filedAt: frToIso(decl.dateDepot),
    amended: String(decl.general?.declarationModificative) === 'true',
    jobs: section(decl, 'activProfCinqDerniereDto', (i) => income(i, { title: 'description', organization: 'employeur' })),
    mandates: section(decl, 'mandatElectifDto', (i) => income(i, { title: 'descriptionMandat', organization: null })),
    consulting: section(decl, 'activConsultantDto', (i) =>
      income(i, { title: 'description', organization: 'nomEmployeur' }),
    ),
    directorships: section(decl, 'participationDirigeantDto', (i) =>
      income(i, { title: 'activite', organization: 'nomSociete' }),
    ),
    holdings: section(decl, 'participationFinanciereDto', (i) => ({
      company: clean(i.nomSociete),
      value: parseAmount(i.evaluation),
      valueText: amountText(i.evaluation),
      capitalShare: clean(i.capitalDetenu),
      shareCount: clean(i.nombreParts),
      income: clean(i.remuneration),
    })),
  }
}

// Matching from the safest rule to the loosest; a declaration is assigned at most once
const RULES = [
  // same birth date, surname and first name match
  (o, c) => c.birth === o.birthDate && intersects(o.lastNameTokens, c.tokens) && intersects(o.firstNameTokens, c.tokens),
  // same birth date and surname, different usual first name (Jimmy / Jean-Michel)
  (o, c) => c.birth === o.birthDate && intersects(o.lastNameTokens, c.tokens),
  // surname and first name match, birth date mistyped on one side
  (o, c) => intersects(o.lastNameTokens, c.tokens) && intersects(o.firstNameTokens, c.tokens),
]

/**
 * Downloads both HATVP files once and returns a function
 * (officials, mandate) => Map(official id → HATVP data), called once per page.
 *
 * `mandate` describes the office to look for:
 * - `mandateType`: value of `type_mandat` in liste.csv ("depute", "senateur", "gouvernement"…);
 * - `isDeclaration(general)`: whether an XML declaration (its `general` block) is a declaration of interests
 *   for this office. Only declarations of interests are ever read: asset declarations (DSP), present in the
 *   XML for members of the Government, are skipped;
 * - `originId(official)`: the official's id as the HATVP writes it in `id_origine` (null when it has none).
 *
 * Each entry also carries `declarantBirthDate`, the birth date given in the matched declaration, for pages
 * whose source has none (the Government); callers remove it before writing.
 *
 * Statuses come from liste.csv (joined on `id_origine`), the content of declarations of interests from
 * the consolidated XML (joined on name + birth date). Parliamentarians' asset declarations are not
 * published online (they can only be consulted in a prefecture, art. LO 135-2 of the electoral code):
 * only their filing status is kept.
 */
export async function loadHatvp() {
  console.log('Downloading HATVP…')
  const [csv, xml] = await Promise.all([LIST_URL, DECLARATIONS_URL].map(async (url) => (await download(url)).text()))
  const rows = parseCsv(csv)

  const parser = new XMLParser({
    parseTagValue: false,
    isArray: (name, _path, isLeaf) => name === 'declaration' || (name === 'montant' && !isLeaf),
  })
  const declarations = asArray(parser.parse(xml).declarations?.declaration)

  const hatvpFor = (officials, { mandateType, isDeclaration, originId }) => {
    const nameKey = (lastName, firstName) => `nom:${normalizeName(lastName)}${normalizeName(firstName)}`

    // Rows keyed by id_origine, or by surname + first name when id_origine is empty
    const rowsByKey = new Map()
    // Every row for the same person shares url_dossier, whatever the mandate:
    // that is what reveals the other declared offices (senator, mayor, EPCI president…)
    const othersByFile = new Map()
    const push = (map, key, r) => map.set(key, [...(map.get(key) ?? []), r])
    for (const r of rows) {
      if (r.type_mandat === mandateType) push(rowsByKey, r.id_origine || nameKey(r.nom, r.prenom), r)
      else if (r.url_dossier) push(othersByFile, r.url_dossier, r)
    }

    // Declarations of interests for this mandate. The same person (name + birth date) often has
    // several: the most recent one (DIA or DIAM) restates the full declaration.
    const declarants = new Map()
    for (const d of declarations) {
      const g = d.general ?? {}
      if (!isDeclaration(g)) continue
      const birth = frToIso(g.declarant?.dateNaissance)
      const key = `${normalizeName(g.declarant?.nom)}|${normalizeName(g.declarant?.prenom)}|${birth}`
      const filedAt = frToIso(d.dateDepot) ?? ''
      const current = declarants.get(key)
      if (current && current.filedAt >= filedAt) continue
      declarants.set(key, {
        key,
        birth,
        filedAt,
        // Surname and first name are sometimes swapped in declarations
        tokens: nameTokens(g.declarant?.nom, g.declarant?.prenom),
        decl: d,
      })
    }
    const candidates = [...declarants.values()]

    const pending = officials.map((o) => ({
      ...o,
      lastNameTokens: nameTokens(o.lastName),
      firstNameTokens: nameTokens(o.firstName),
    }))
    const claimed = new Set()
    const interestsById = new Map()
    for (const rule of RULES) {
      for (const official of pending) {
        if (interestsById.has(official.id)) continue
        const matches = candidates.filter((c) => !claimed.has(c.key) && rule(official, c))
        if (matches.length !== 1) continue
        claimed.add(matches[0].key)
        interestsById.set(official.id, matches[0].decl)
      }
    }

    return new Map(
      officials.map((official) => {
        const own =
          rowsByKey.get(originId(official) ?? '') ?? rowsByKey.get(nameKey(official.lastName, official.firstName)) ?? []
        const interests = interestsById.get(official.id)
        return [
          official.id,
          {
            page: own[0]?.url_dossier ? HATVP_BASE + own[0].url_dossier : null,
            declarations: own
              .map((r) => ({
                type: r.type_document,
                label: DOCUMENT_LABELS[r.type_document] ?? r.type_document,
                filedAt: r.date_depot || null,
                publishedAt: r.date_publication || null,
                status: r.statut_publication || null,
              }))
              .sort((a, b) => (b.filedAt ?? '').localeCompare(a.filedAt ?? '')),
            interests: interests ? extractInterests(interests) : null,
            otherMandates: otherMandates(othersByFile.get(own[0]?.url_dossier)),
            declarantBirthDate: frToIso(interests?.general?.declarant?.dateNaissance),
          },
        ]
      }),
    )
  }
  /**
   * People who hold no office the page is about (announced candidates), each with the HATVP file checked by hand
   * (`hatvp`: `url_dossier` without "/pages_nominatives/"). Returns Map(id → data) for those who have one: every
   * office and filing of the file, and the content of their most recent declaration of interests, whatever the
   * office. Declarations are matched on names; an optional `birthDate` settles homonyms.
   */
  hatvpFor.byFile = (people) => {
    const byFile = new Map()
    for (const r of rows) if (r.url_dossier) byFile.set(r.url_dossier, [...(byFile.get(r.url_dossier) ?? []), r])
    const filedNames = new Set(rows.map((r) => `${normalizeName(r.nom)}|${normalizeName(r.prenom)}`))

    const result = new Map()
    for (const person of people) {
      if (!person.hatvp) {
        // A new file may have appeared since the list was checked: flag it rather than guess it is the same person
        if (filedNames.has(`${normalizeName(person.lastName)}|${normalizeName(person.firstName)}`))
          console.warn(`  HATVP: a file named ${person.firstName} ${person.lastName} exists, check it and set \`hatvp\``)
        continue
      }
      const own = byFile.get(`/pages_nominatives/${person.hatvp}`)
      if (!own) throw new Error(`HATVP: no file ${person.hatvp} for ${person.firstName} ${person.lastName}`)

      // Declarations of interests only (DIA for parliamentarians, DI for local and European offices): asset
      // declarations are never read
      const lastNameTokens = nameTokens(person.lastName)
      const firstNameTokens = nameTokens(person.firstName)
      const matches = declarations.filter((d) => {
        const g = d.general ?? {}
        if (!['DIA', 'DI'].includes(g.typeDeclaration?.id)) return false
        const tokens = nameTokens(g.declarant?.nom, g.declarant?.prenom)
        if (!intersects(lastNameTokens, tokens) || !intersects(firstNameTokens, tokens)) return false
        return !person.birthDate || frToIso(g.declarant?.dateNaissance) === person.birthDate
      })
      const births = new Set(matches.map((d) => frToIso(d.general.declarant?.dateNaissance)))
      if (births.size > 1)
        throw new Error(`HATVP: homonyms for ${person.firstName} ${person.lastName} (${[...births]}), set \`birthDate\``)
      const latest = matches.sort((a, b) => (frToIso(b.dateDepot) ?? '').localeCompare(frToIso(a.dateDepot) ?? ''))[0]
      const office = latest?.general.qualiteMandat

      result.set(person.id, {
        page: HATVP_BASE + own[0].url_dossier,
        offices: otherMandates(own),
        // Filings of declarations of interests: those of asset declarations say nothing about a candidate
        declarations: own
          .filter((r) => INTEREST_DOCUMENTS.includes(r.type_document))
          .map((r) => ({
            type: r.type_document,
            label: DOCUMENT_LABELS[r.type_document] ?? r.type_document,
            institution: MANDATE_TYPES[r.type_mandat] ?? r.type_mandat,
            filedAt: r.date_depot || null,
            publishedAt: r.date_publication || null,
            status: r.statut_publication || null,
          }))
          .sort((a, b) => (b.filedAt ?? '').localeCompare(a.filedAt ?? '')),
        interests: latest ? extractInterests(latest) : null,
        interestsFor: latest
          ? (clean(office?.labelTypeMandat) ?? MANDATE_TYPES[office?.codTypeMandatFichier] ?? clean(office?.codTypeMandatFichier))
          : null,
      })
    }
    return result
  }
  // Raw liste.csv rows, for checks that need the whole list (members of the Government)
  hatvpFor.rows = rows
  return hatvpFor
}

// One entry per office, with the date of the most recent filing
function otherMandates(rows) {
  const byOffice = new Map()
  for (const r of rows ?? []) {
    const key = `${r.type_mandat}|${r.qualite}`
    const current = byOffice.get(key)
    if (current && (current.lastFiledAt ?? '') >= r.date_depot) continue
    byOffice.set(key, {
      type: r.type_mandat,
      institution: MANDATE_TYPES[r.type_mandat] ?? r.type_mandat,
      role: r.qualite || null,
      lastFiledAt: r.date_depot || null,
    })
  }
  return [...byOffice.values()].sort((a, b) => (b.lastFiledAt ?? '').localeCompare(a.lastFiledAt ?? ''))
}
