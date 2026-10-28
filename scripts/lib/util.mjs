// Helpers shared by every data script

/** Single values may or may not be arrays in the AN and HATVP open data */
export const asArray = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v])

/** Text value, or null for the AN's empty objects (`{ "@xsi:nil": "true" }`) */
export const text = (v) => (v == null || typeof v === 'object' ? null : String(v))

/** Downloads a URL and fails on any error status: an unavailable source must break the build */
export async function download(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`)
  return res
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

// "Lucas-Lundy" → {"LUCAS", "LUNDY", "LUCASLUNDY"}: usual names often differ from one source to another
export const nameTokens = (...parts) =>
  new Set(
    parts
      .flatMap((p) => [p, ...(p ?? '').split(/[^\p{L}]+/u)])
      .map(normalizeName)
      .filter((t) => t.length >= 2),
  )

export const intersects = (a, b) => [...a].some((t) => b.has(t))

/** Comma-separated CSV with quoted fields (Sénat open data); lines starting with `%` are comments */
export function parseQuotedCsv(text) {
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
    else if (c === ',') endField()
    else if (c === '\n') endRow()
    else field += c
  }
  if (field || row.length) endRow()
  const [header, ...lines] = rows
  return lines.map((values) => Object.fromEntries(header.map((c, i) => [c, values[i] ?? ''])))
}
