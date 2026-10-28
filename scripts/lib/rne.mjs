// Répertoire national des élus (RNE, ministère de l'Intérieur): local mandates currently held.
// The files are republished under a new URL on every update: they are found by title through the
// data.gouv.fr API.
import { download, intersects, nameTokens, parseCsv } from './util.mjs'

const DATASET_API = 'https://www.data.gouv.fr/api/1/datasets/repertoire-national-des-elus-1/'

// data.gouv resource title → mandate type. Mayors also appear in the municipal councillors file
// (role "Maire"), so the mayors file is not used.
const FILES = [
  { title: /conseillers-municipaux/, type: 'municipal', label: 'Conseiller municipal' },
  { title: /conseillers-darrondissements/, type: 'district', label: "Conseiller d'arrondissement" },
  { title: /conseillers-communautaires/, type: 'intercommunal', label: 'Conseiller communautaire' },
  { title: /conseillers-departementaux/, type: 'departmental', label: 'Conseiller départemental' },
  { title: /conseillers-regionaux/, type: 'regional', label: 'Conseiller régional' },
  { title: /membres-assemblee/, type: 'territorial', label: "Membre d'une assemblée territoriale" },
  { title: /Parlement-europ/, type: 'european', label: 'Député européen' },
]

const PLACE_COLUMNS = [
  'Libellé de la commune',
  "Libellé de l'EPCI",
  'Libellé du canton',
  'Libellé de la collectivité à statut particulier',
  // Métropole de Lyon: only the constituency is filled in
  'Libellé de la circonscription métropolitaine',
  'Libellé de la région',
]

/** Returns a function (officials) => Map(official id → current local mandates), called once per page */
export async function loadRne() {
  console.log('Downloading RNE…')
  const { resources } = await (await download(DATASET_API)).json()

  const files = await Promise.all(
    FILES.map(async (f) => {
      const resource = resources.find((r) => f.title.test(r.title))
      if (!resource) throw new Error(`RNE: file not found (${f.title})`)
      const csv = await download(resource.url)
      return { ...f, rows: parseCsv(await csv.text()), updatedAt: resource.last_modified?.slice(0, 10) ?? null }
    }),
  )

  return (officials) => {
    // Matched on exact birth date and surname
    const byBirthDate = new Map()
    for (const o of officials) {
      if (!o.birthDate) continue
      const list = byBirthDate.get(o.birthDate) ?? []
      list.push({ id: o.id, lastName: nameTokens(o.lastName), firstName: nameTokens(o.firstName) })
      byBirthDate.set(o.birthDate, list)
    }

    const result = new Map()
    for (const f of files) {
      for (const r of f.rows) {
        const candidates = byBirthDate.get(r['Date de naissance'])
        if (!candidates) continue
        let matches = candidates.filter((c) => intersects(nameTokens(r["Nom de l'élu"]), c.lastName))
        // Namesakes born on the same day: the first name breaks the tie
        if (matches.length > 1)
          matches = matches.filter((c) => intersects(nameTokens(r["Prénom de l'élu"]), c.firstName))
        if (matches.length !== 1) continue
        const id = matches[0].id
        result.set(id, [
          ...(result.get(id) ?? []),
          {
            type: f.type,
            label: f.label,
            place: PLACE_COLUMNS.map((k) => r[k]).find(Boolean) ?? null,
            role: r['Libellé de la fonction'] || null,
            start: r['Date de début du mandat'] || null,
            roleStart: r['Date de début de la fonction'] || null,
            updatedAt: f.updatedAt,
          },
        ])
      }
    }
    return result
  }
}
