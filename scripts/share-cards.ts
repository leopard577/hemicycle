// Share pages with a preview image per person, written into dist/ after `vite build`.
//
// WhatsApp, X and the other link previewers never see the hash of a URL (#/deputes?fiche=PA1234), so every panel
// link used to show the site's generic image. Each person gets instead a static page, partage/<page>/<id>.html, with
// their own Open Graph tags and a 1200 × 630 image (portrait, name, pay), which sends visitors on to the panel.
// The figures are computed with the app's own helpers (src/lib/money.ts), so the card and the panel always agree.
//
// Run with `npm run share` after `npm run build`. Portraits are fetched from assemblee-nationale.fr and senat.fr;
// never from hatvp.fr (copyright). A portrait that fails to load is replaced by initials, it never fails the build.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import satori from 'satori'
import sharp from 'sharp'
import { formatEuro } from '@/lib/format'
import { rankLabel } from '@/lib/government'
import { incomeLines, monthlyCost, sideIncome } from '@/lib/money'
import { DEPUTY, GOVERNMENT_MEMBER, type Office, PRESIDENT, SENATOR } from '@/lib/offices'
import { PAGES } from '@/lib/pages'
import { SHARE_DIR, SITE_NAME, SITE_URL, X_ACCOUNT } from '@/lib/site'
import type { Deputy, GovernmentMember, GovernmentPayScales, Group, Official, PayScales, Senator } from '@/types'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')
const DATA = path.join(ROOT, 'public/data')
const WIDTH = 1200
const HEIGHT = 630
const CONCURRENCY = 8

// Colours of the generic preview image (public/og-image.png) and of the panel's cost box
const COLORS = { paper: '#fbf9f4', ink: '#111827', muted: '#4b5563', navy: '#1e2a78', red: '#b91c1c', redSoft: '#fbeceb' }

/* ---------- What a card says ---------- */

interface Card {
  page: string
  id: string
  name: string
  /** Office, group and place, above the name */
  kicker: string
  photo: string
  accent: string
  pay: { label: string; monthly: number }
  /** Declared side income, latest published year: a sum computed from the HATVP declaration */
  side: { total: number; year: number } | null
  /** Smaller line under the pay */
  footnote: string | null
  sources: string
}

// The AN tells homonyms apart with their department, "Martin (Alpes-Maritimes)": the card already shows it
const fullName = (o: Official) => `${o.firstName} ${o.lastName.replace(/\s*\(.*\)$/, '')}`
const euro = (n: number) => formatEuro(n, { round: true })
/** A declared amount as published: cents only when there are some, never rounded */
const declared = (n: number) => formatEuro(n, { round: Number.isInteger(n) })

function side(o: Official, office: Office) {
  const income = sideIncome(incomeLines(o), office)
  if (!o.hatvp.interests || income.total <= 0) return null
  return { total: income.total, year: Math.max(0, ...income.lines.map((l) => l.latest?.year ?? 0)) }
}

function parliamentCards(
  page: string,
  office: Office,
  data: { payScales: PayScales; groups: Group[]; members: (Deputy | Senator)[] },
  place: (m: Deputy | Senator) => string | null,
  institution: string,
): Card[] {
  const groups = new Map(data.groups.map((g) => [g.id, g]))
  return data.members.map((m) => {
    const group = m.groupId ? groups.get(m.groupId) : undefined
    const cost = monthlyCost(m, data.payScales)
    const pay = cost.allowance + cost.special
    return {
      page,
      id: m.id,
      name: fullName(m),
      kicker: [office.title(m.honorific === 'Mme'), group?.abbrev, place(m)].filter(Boolean).join(' · '),
      photo: m.photo,
      accent: group?.color ?? COLORS.navy,
      pay: { label: cost.special > 0 ? 'Indemnités brutes' : 'Indemnité brute', monthly: pay },
      side: side(m, office),
      footnote: `Son siège coûte ${euro(cost.total)} par mois aux contribuables`,
      sources: `Sources : ${institution}, HATVP`,
    }
  })
}

function governmentCards(page: string, data: { payScales: GovernmentPayScales; members: GovernmentMember[] }): Card[] {
  return data.members.map((m) => {
    const pay = data.payScales.ranks[m.rank].gross
    const rank = rankLabel(m)
    return {
      page,
      id: m.id,
      name: fullName(m),
      kicker: m.role === rank ? rank : m.role,
      photo: m.photo,
      accent: COLORS.navy,
      pay: { label: 'Rémunération brute', monthly: pay },
      side: side(m, m.rank === 'president' ? PRESIDENT : GOVERNMENT_MEMBER),
      footnote: `soit ${euro(pay * 12)} par an`,
      sources: 'Sources : Légifrance, HATVP',
    }
  })
}

/* ---------- Image ---------- */

// Satori takes React-like elements: a tiny helper avoids pulling in React and a JSX setup for one script
type Node = { type: string; props: Record<string, unknown> } | string | null
const h = (type: string, style: Record<string, unknown>, ...children: Node[]): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.filter((c) => c !== null) },
})

// Fonts of the site (Geist, Source Serif 4), as WOFF: satori does not read WOFF2
const font = (pkg: string, file: string) => readFile(path.join(ROOT, 'node_modules/@fontsource', pkg, 'files', file))
const FONTS = [
  { name: 'Geist', weight: 400 as const, data: await font('geist', 'geist-latin-400-normal.woff') },
  { name: 'Geist', weight: 600 as const, data: await font('geist', 'geist-latin-600-normal.woff') },
  { name: 'Serif', weight: 700 as const, data: await font('source-serif-4', 'source-serif-4-latin-700-normal.woff') },
]

/** Portrait as a data URI, or null to show initials */
async function portrait(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(400, 400, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 85 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return null
  }
}

function layout(card: Card, photo: string | null): Node {
  const initials = card.name
    .split(/[\s-]+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  const avatar = photo
    ? { type: 'img', props: { src: photo, width: 300, height: 300, style: { borderRadius: 150, objectFit: 'cover' } } }
    : h(
        'div',
        { width: 300, height: 300, borderRadius: 150, background: card.accent, color: '#fff', fontSize: 110 },
        h('div', { margin: 'auto', fontFamily: 'Serif' }, initials),
      )
  const nameSize = card.name.length > 26 ? 52 : card.name.length > 18 ? 62 : 72

  return h(
    'div',
    {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      flexDirection: 'column',
      background: COLORS.paper,
      color: COLORS.ink,
      fontFamily: 'Geist',
      padding: '44px 64px',
    },
    h(
      'div',
      { justifyContent: 'space-between', fontSize: 22, fontWeight: 600, letterSpacing: 4, color: COLORS.navy },
      h('div', {}, new URL(SITE_URL).host.toUpperCase()),
    ),
    h(
      'div',
      { flex: 1, alignItems: 'center', gap: 56 },
      h('div', { padding: 10, borderRadius: 170, background: card.accent, flexShrink: 0 }, avatar),
      h(
        'div',
        { flexDirection: 'column', flex: 1, minWidth: 0 },
        h('div', { fontSize: 24, color: COLORS.muted, marginBottom: 6 }, card.kicker),
        h('div', { fontFamily: 'Serif', fontSize: nameSize, lineHeight: 1.05, marginBottom: 24 }, card.name),
        h(
          'div',
          {
            flexDirection: 'column',
            background: COLORS.redSoft,
            border: `2px solid ${COLORS.red}33`,
            borderRadius: 20,
            padding: '18px 26px',
          },
          h('div', { fontSize: 20, fontWeight: 600, letterSpacing: 2, color: COLORS.red }, card.pay.label.toUpperCase()),
          h(
            'div',
            { alignItems: 'baseline', gap: 12 },
            h('div', { fontFamily: 'Serif', fontSize: 76, lineHeight: 1.1 }, euro(card.pay.monthly)),
            h('div', { fontSize: 28, color: COLORS.muted }, '/ mois'),
          ),
          card.side &&
            h(
              'div',
              { fontSize: 24, fontWeight: 600, color: COLORS.red },
              // Declared amounts are never rounded; the total is a sum, said to be one (HATVP legal notice)
              `+ ${declared(card.side.total)} par an d'autres revenus déclarés (${card.side.year})`,
            ),
        ),
        card.footnote && h('div', { fontSize: 22, color: COLORS.muted, marginTop: 14 }, card.footnote),
      ),
    ),
    h(
      'div',
      { fontSize: 18, color: COLORS.muted },
      `${card.sources}${card.side ? ' (somme calculée des montants déclarés)' : ''} · Données officielles`,
    ),
  )
}

async function image(card: Card) {
  const photo = await portrait(card.photo)
  const svg = await satori(layout(card, photo) as never, { width: WIDTH, height: HEIGHT, fonts: FONTS })
  // JPEG keeps each card well under WhatsApp's ~300 kB preview limit
  return { jpeg: await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toBuffer(), photo: photo !== null }
}

/* ---------- Page ---------- */

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function html(card: Card, version: string) {
  const file = encodeURIComponent(card.id)
  const pageUrl = `${SITE_URL}${SHARE_DIR}/${card.page}/${file}`
  // Versioned so that previewers which cache images by URL pick up new figures after a data refresh
  const imageUrl = `${pageUrl}.jpg?v=${version}`
  // Relative, so that the site also works under /<repo>/ on GitHub Pages
  const panel = `../../#/${card.page}?fiche=${file}`
  const title = `${card.name} · ${SITE_NAME}`
  const description =
    `${card.kicker}. ${card.pay.label} : ${euro(card.pay.monthly)} par mois` +
    (card.side ? `, plus ${declared(card.side.total)} par an d'autres revenus déclarés (${card.side.year})` : '') +
    '. Rémunérations, cumuls et déclarations, à partir des données officielles.'
  const meta = (attr: string, key: string, value: string) => `<meta ${attr}="${key}" content="${escape(value)}" />`

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escape(title)}</title>
    ${meta('name', 'description', description)}
    <link rel="canonical" href="${escape(pageUrl)}" />
    ${meta('property', 'og:type', 'profile')}
    ${meta('property', 'og:locale', 'fr_FR')}
    ${meta('property', 'og:site_name', SITE_NAME)}
    ${meta('property', 'og:url', pageUrl)}
    ${meta('property', 'og:title', title)}
    ${meta('property', 'og:description', description)}
    ${meta('property', 'og:image', imageUrl)}
    ${meta('property', 'og:image:type', 'image/jpeg')}
    ${meta('property', 'og:image:width', String(WIDTH))}
    ${meta('property', 'og:image:height', String(HEIGHT))}
    ${meta('property', 'og:image:alt', `${card.name} : ${card.pay.label.toLowerCase()} de ${euro(card.pay.monthly)} par mois`)}
    ${meta('name', 'twitter:card', 'summary_large_image')}
    ${meta('name', 'twitter:site', `@${X_ACCOUNT}`)}
    <!-- Previewers do not run scripts: they read the tags above, visitors go on to the panel -->
    <script>location.replace(${JSON.stringify(panel)})</script>
  </head>
  <body>
    <p><a href="${escape(panel)}">Voir la fiche de ${escape(card.name)}</a></p>
  </body>
</html>
`
}

/* ---------- Run ---------- */

const read = async (file: string) => JSON.parse(await readFile(path.join(DATA, file), 'utf8'))
const pathOf = (id: string) => PAGES.find((p) => p.id === id)!.path

const only = process.argv[2] // optional id filter, to preview a few cards: `npm run share -- PA841657`
const cards = [
  ...parliamentCards(pathOf('deputies'), DEPUTY, await read('deputies.json'), (m) => (m as Deputy).department, 'Assemblée nationale'),
  ...parliamentCards(pathOf('senators'), SENATOR, await read('senators.json'), (m) => (m as Senator).constituency, 'Sénat'),
  ...governmentCards(pathOf('government'), await read('government.json')),
].filter((c) => !only || c.id.includes(only))
const version = new Date().toISOString().slice(0, 10).replaceAll('-', '')

try {
  await readFile(path.join(DIST, 'index.html'))
} catch {
  throw new Error('dist/index.html is missing: run `npm run build` before `npm run share`')
}

console.log(`Share cards: ${cards.length} people`)
let done = 0
let withoutPhoto = 0
const queue = [...cards]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let card = queue.shift(); card; card = queue.shift()) {
      const dir = path.join(DIST, SHARE_DIR, card.page)
      await mkdir(dir, { recursive: true })
      const { jpeg, photo } = await image(card)
      if (!photo) withoutPhoto++
      await writeFile(path.join(dir, `${card.id}.jpg`), jpeg)
      await writeFile(path.join(dir, `${card.id}.html`), html(card, version))
      if (++done % 100 === 0) console.log(`  ${done} / ${cards.length}`)
    }
  }),
)
console.log(`  Done: ${done} pages in dist/${SHARE_DIR}/, ${withoutPhoto} with initials instead of a portrait`)
