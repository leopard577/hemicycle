// One-off import of Casier Politique (Raphaël Jolivet, https://codeberg.org/raphael-jolivet/crapulopedia, CC BY-NC-SA
// 4.0) into scripts/data/casier-politique.json. Run by hand after pulling a new version of its data:
//
//   git clone --depth 1 https://codeberg.org/raphael-jolivet/crapulopedia.git <clone>
//   node scripts/import-casier-politique.mjs <clone>
//
// The snapshot is committed, so that `npm run data` needs no network for it and nothing reaches the site before a
// person has looked at the diff. Only what the pages need is kept: identity and convictions, not the Wikipedia text.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'data', 'casier-politique.json')
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

const clone = process.argv[2]
if (!clone) throw new Error('Usage: node scripts/import-casier-politique.mjs <path to a clone of crapulopedia>')
const dir = join(clone, 'data', 'out', 'politicians')

// "né le 4 mars 1954", "née le 1er juin 1959" in the first lines of the Wikipedia article
function birthDate(description) {
  const m = /née?\s+le\s+(\d{1,2})(?:er)?\s+(\p{L}+)\s+(\d{4})/u.exec(description ?? '')
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1
  return month === -1 ? null : `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

// The extraction fills empty penalties with phrases such as "Aucune autre peine mentionnée"
const otherPenalty = (v) => (!v || /^(aucune|none|non précis)/i.test(v) ? null : v)

// Python's json module writes NaN, which JSON.parse refuses; none of the fields kept here needs it
const read = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8').replace(/\bNaN\b/g, 'null'))

const people = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map(read)
  .filter((p) => p.affaires?.length)
  .map((p) => ({
    id: p.id,
    name: p.name,
    birthDate: birthDate(p.description),
    wikipedia: p.wikipedia,
    wikipediaUpdatedAt: p.last_wiki_update?.slice(0, 10) ?? null,
    convictions: p.affaires.map((a) => ({
      date: a.date_condamnation,
      title: a.titre,
      offence: a.infraction,
      description: a.description,
      status: a.etat_recours,
      prison: [a.prison_total_months, a.prison_sursis_months],
      fine: [a.amende_total, a.amende_sursis],
      currency: a.amende_devise,
      ineligibility: [a.ineligibilite_total_months, a.ineligibilite_sursis_months],
      otherPenalty: otherPenalty(a.autre_peine),
    })),
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

const commit = execFileSync('git', ['-C', clone, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify({ commit, people }, null, 1)}\n`)
console.log(`${people.length} people, ${people.reduce((n, p) => n + p.convictions.length, 0)} convictions, commit ${commit}`)
