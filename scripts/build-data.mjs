// Downloads the open data and writes one JSON file per page in public/data/.
// Shared sources (HATVP, RNE) are downloaded once for every page. When a source is unreachable, the pages that need
// it keep their last published version, so that one site being down does not block the deploy.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCandidates, loadCandidates } from './candidates.mjs'
import { buildCandidates2027 } from './candidates-2027.mjs'
import { buildDeputies, loadAssemblyActors, loadDeputies } from './deputies.mjs'
import { buildGovernment } from './government.mjs'
import { loadMinistryBudgets } from './government-costs.mjs'
import { loadHatvp } from './lib/hatvp.mjs'
import { loadRne } from './lib/rne.mjs'
import { SourceUnavailable } from './lib/util.mjs'
import { buildSenators, loadSenators } from './senators.mjs'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')

// Live site: a page whose sources cannot be reached keeps the dataset it last published, with its own generatedAt
const PUBLISHED = 'https://noseluscoutent.fr/data'

const LOADERS = {
  hatvp: loadHatvp,
  rne: loadRne,
  assembly: loadDeputies,
  assemblyActors: loadAssemblyActors,
  senate: loadSenators,
  elections: loadCandidates,
  ministries: loadMinistryBudgets,
}

// An unreachable source is left out (null); any other failure breaks the build
const sources = Object.fromEntries(
  await Promise.all(
    Object.entries(LOADERS).map(([name, load]) =>
      load().then(
        (value) => [name, value],
        (e) => {
          if (!(e instanceof SourceUnavailable)) throw e
          warn(`${name} unavailable: ${e.message}`)
          return [name, null]
        },
      ),
    ),
  ),
)
const shared = { hatvpFor: sources.hatvp, rneFor: sources.rne }
const generatedAt = new Date().toISOString()

// Shown as an annotation on the GitHub Actions run
function warn(message) {
  console.warn(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `! ${message}`)
}

function write(page, data) {
  const out = join(OUT_DIR, `${page}.json`)
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(out, JSON.stringify(data))
  console.log(`  → ${out}`)
}

// Each page with the sources it needs
const PAGES = [
  ['deputies', ['hatvp', 'rne', 'assembly'], (s) => buildDeputies(s.assembly, shared)],
  ['senators', ['hatvp', 'rne', 'senate'], (s) => buildSenators(s.senate, shared)],
  [
    'government',
    ['hatvp', 'rne', 'senate', 'assemblyActors', 'ministries'],
    (s) => buildGovernment({ ...shared, hatvpRows: s.hatvp.rows, senate: s.senate, assemblyActors: s.assemblyActors, ministries: s.ministries }),
  ],
  ['candidates', ['elections'], (s) => buildCandidates(s.elections)],
  ['candidates-2027', ['hatvp'], () => buildCandidates2027(shared)],
]

for (const [page, needs, build] of PAGES) {
  const missing = needs.filter((name) => !sources[name])
  if (!missing.length) {
    write(page, { generatedAt, ...build(sources) })
    continue
  }
  const res = await fetch(`${PUBLISHED}/${page}.json`)
  if (!res.ok) throw new Error(`${page}: ${missing.join(', ')} unavailable and no published copy (HTTP ${res.status})`)
  const published = await res.json()
  warn(`${page}: kept as published on ${published.generatedAt} (${missing.join(', ')} unavailable)`)
  write(page, published)
}
