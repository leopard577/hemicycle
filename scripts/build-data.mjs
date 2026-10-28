// Downloads the open data and writes one JSON file per page in public/data/.
// Shared sources (HATVP, RNE) are downloaded once for every page.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCandidates, loadCandidates } from './candidates.mjs'
import { buildDeputies, loadAssemblyActors, loadDeputies } from './deputies.mjs'
import { buildGovernment } from './government.mjs'
import { loadHatvp } from './lib/hatvp.mjs'
import { loadRne } from './lib/rne.mjs'
import { buildSenators, loadSenators } from './senators.mjs'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')

const [hatvpFor, rneFor, assembly, assemblyActors, senate, elections] = await Promise.all([
  loadHatvp(),
  loadRne(),
  loadDeputies(),
  loadAssemblyActors(),
  loadSenators(),
  loadCandidates(),
])
const shared = { hatvpFor, rneFor }
const generatedAt = new Date().toISOString()

function write(page, data) {
  const out = join(OUT_DIR, `${page}.json`)
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(out, JSON.stringify({ generatedAt, ...data }))
  console.log(`  → ${out}`)
}

write('deputies', buildDeputies(assembly, shared))
write('senators', buildSenators(senate, shared))
write('government', buildGovernment({ ...shared, hatvpRows: hatvpFor.rows, senate, assemblyActors }))
write('candidates', buildCandidates(elections))
