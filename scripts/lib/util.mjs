// Helpers shared by every data script

/** Single values may or may not be arrays in the AN and HATVP open data */
export const asArray = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v])

/** Text value, or null for the AN's empty objects (`{ "@xsi:nil": "true" }`) */
export const text = (v) => (v == null || typeof v === 'object' ? null : String(v))

/**
 * A source that cannot be reached right now (network error, HTTP 5xx or 429): `build-data.mjs` then keeps the
 * pages that need it as last published. Any other failure (404, unexpected content) still breaks the build.
 */
export class SourceUnavailable extends Error {}

/** Downloads a URL and fails on any error status */
export async function download(url, init) {
  let res
  try {
    res = await fetch(url, init)
  } catch (e) {
    throw new SourceUnavailable(`${e.cause?.code ?? e.message} on ${url}`, { cause: e })
  }
  if (res.status >= 500 || res.status === 429) throw new SourceUnavailable(`HTTP ${res.status} on ${url}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`)
  return res
}

/**
 * Downloads a large file as a Buffer, resuming with a Range request when the server cuts the response
 * (the AN archives often end early)
 */
export async function downloadResumable(url, attempts = 6) {
  const chunks = []
  let received = 0
  let total = null
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await download(url, received ? { headers: { Range: `bytes=${received}-` } } : {})
    if (received && res.status !== 206) throw new Error(`No resume support on ${url}`)
    total ??= Number(res.headers.get('content-length')) || null
    try {
      for await (const chunk of res.body) {
        chunks.push(chunk)
        received += chunk.length
      }
      if (total === null || received >= total) return Buffer.concat(chunks)
    } catch (e) {
      if (attempt === attempts) throw new SourceUnavailable(`${e.message} on ${url}`, { cause: e })
    }
  }
  throw new SourceUnavailable(`Incomplete download (${received} of ${total} bytes) on ${url}`)
}

/** Semicolon-separated CSV, without quotes */
export function parseCsv(text) {
  const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
  const cols = header.split(';')
  return lines.map((line) => {
    const values = line.split(';')
    return Object.fromEntries(cols.map((c, i) => [c, values[i] ?? '']))
  })
}

// "dd/mm/yyyy[ hh:mm:ss]" → "yyyy-mm-dd"
export const frToIso = (v) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(v ?? '')
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

export const normalizeName = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')

// Particles are not distinctive on their own: "Le Hénanff" must not match "Le Saout" born the same day
const PARTICLES = new Set(['LE', 'LA', 'LES', 'DE', 'DU', 'DES', 'DI', 'DA', 'DEL', 'DOS', 'VAN', 'VON', 'DER', 'DEN'])

// "Lucas-Lundy" → {"LUCAS", "LUNDY", "LUCASLUNDY"}: usual names often differ from one source to another.
// The full string always counts, so a name made of a particle alone still matches itself.
export const nameTokens = (...parts) =>
  new Set(
    parts.flatMap((p) => [
      normalizeName(p),
      ...(p ?? '')
        .split(/[^\p{L}]+/u)
        .map(normalizeName)
        .filter((t) => t.length >= 2 && !PARTICLES.has(t)),
    ]).filter((t) => t.length >= 2),
  )

export const intersects = (a, b) => [...a].some((t) => b.has(t))

/**
 * CSV with quoted fields, comma-separated by default (Sénat open data; the Conseil constitutionnel uses `;`).
 * Lines starting with `%` are comments.
 */
export function parseQuotedCsv(text, separator = ',') {
  const body = text
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('%'))
    .join('\n')
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (quoted) {
      if (c !== '"') field += c
      else if (body[i + 1] === '"') {
        field += '"'
        i++
      } else quoted = false
    } else if (c === '"') quoted = true
    else if (c === separator) endField()
    else if (c === '\n') endRow()
    else field += c
  }
  if (field || row.length) endRow()
  const [header, ...lines] = rows
  return lines.map((values) => Object.fromEntries(header.map((c, i) => [c, values[i] ?? ''])))
}
