// Répertoire national des élus (RNE, ministère de l'Intérieur) : mandats locaux en cours.
// Les fichiers sont republiés sous une nouvelle URL à chaque mise à jour : on les retrouve par leur titre
// via l'API de data.gouv.fr.
import { normalizeName } from './hatvp.mjs'

const DATASET_API = 'https://www.data.gouv.fr/api/1/datasets/repertoire-national-des-elus-1/'

// Titre de la ressource data.gouv → type de mandat. Les maires figurent aussi dans le fichier des
// conseillers municipaux (fonction « Maire »), le fichier des maires n'est donc pas repris.
const FICHIERS = [
  { titre: /conseillers-municipaux/, type: 'municipal', libelle: 'Conseiller municipal' },
  { titre: /conseillers-darrondissements/, type: 'arrondissement', libelle: "Conseiller d'arrondissement" },
  { titre: /conseillers-communautaires/, type: 'communautaire', libelle: 'Conseiller communautaire' },
  { titre: /conseillers-departementaux/, type: 'departemental', libelle: 'Conseiller départemental' },
  { titre: /conseillers-regionaux/, type: 'regional', libelle: 'Conseiller régional' },
  { titre: /membres-assemblee/, type: 'collectivite', libelle: "Membre d'une assemblée territoriale" },
  { titre: /Parlement-europ/, type: 'europeen', libelle: 'Député européen' },
]

const LIEU = [
  'Libellé de la commune',
  "Libellé de l'EPCI",
  'Libellé du canton',
  'Libellé de la collectivité à statut particulier',
  // Métropole de Lyon : seule la circonscription est renseignée
  'Libellé de la circonscription métropolitaine',
  'Libellé de la région',
]

const tokens = (s) =>
  new Set([s, ...(s ?? '').split(/[^\p{L}]+/u)].map(normalizeName).filter((t) => t.length >= 2))

const intersects = (a, b) => [...a].some((t) => b.has(t))

function parseCsv(text) {
  const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
  const cols = header.split(';')
  return lines.map((line) => {
    const values = line.split(';')
    return Object.fromEntries(cols.map((c, i) => [c, values[i] ?? '']))
  })
}

/** Renvoie une fonction (deputes) => Map(id député → mandats locaux en cours) */
export async function loadRne() {
  console.log('Téléchargement RNE…')
  const res = await fetch(DATASET_API)
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${DATASET_API}`)
  const { resources } = await res.json()

  const fichiers = await Promise.all(
    FICHIERS.map(async (f) => {
      const resource = resources.find((r) => f.titre.test(r.title))
      if (!resource) throw new Error(`RNE : fichier introuvable (${f.titre})`)
      const csv = await fetch(resource.url)
      if (!csv.ok) throw new Error(`HTTP ${csv.status} sur ${resource.url}`)
      return { ...f, rows: parseCsv(await csv.text()), miseAJour: resource.last_modified?.slice(0, 10) ?? null }
    }),
  )

  return (deputes) => {
    // Rapprochement par date de naissance exacte et nom de famille
    const parNaissance = new Map()
    for (const d of deputes) {
      if (!d.dateNais) continue
      const liste = parNaissance.get(d.dateNais) ?? []
      liste.push({ id: d.id, nom: tokens(d.nom), prenom: tokens(d.prenom) })
      parNaissance.set(d.dateNais, liste)
    }

    const result = new Map()
    for (const f of fichiers) {
      for (const r of f.rows) {
        const candidats = parNaissance.get(r['Date de naissance'])
        if (!candidats) continue
        let matches = candidats.filter((c) => intersects(tokens(r["Nom de l'élu"]), c.nom))
        // Homonymes nés le même jour : le prénom départage
        if (matches.length > 1) matches = matches.filter((c) => intersects(tokens(r["Prénom de l'élu"]), c.prenom))
        if (matches.length !== 1) continue
        const id = matches[0].id
        result.set(id, [
          ...(result.get(id) ?? []),
          {
            type: f.type,
            libelle: f.libelle,
            lieu: LIEU.map((k) => r[k]).find(Boolean) ?? null,
            fonction: r['Libellé de la fonction'] || null,
            debut: r['Date de début du mandat'] || null,
            debutFonction: r['Date de début de la fonction'] || null,
            miseAJour: f.miseAJour,
          },
        ])
      }
    }
    return result
  }
}
