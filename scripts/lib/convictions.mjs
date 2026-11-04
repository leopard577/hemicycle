// Court decisions from Casier Politique (Raphaël Jolivet, CC BY-NC-SA 4.0): an automatic extraction from French
// Wikipedia by an LLM, committed as a snapshot by `import-casier-politique.mjs`. Decided by the project owner on
// 4 November 2026: it is imported as it is, not checked case by case, and the site says so wherever it is shown. Only
// the people a page lists are published. Three things are added by hand here, keyed by Wikidata id and decision date.
import { readFileSync } from 'node:fs'
import { normalizeName } from './util.mjs'

const SNAPSHOT = new URL('../data/casier-politique.json', import.meta.url)

const STATUS = { definitif: 'final', appel: 'appeal', cassation: 'cassation' }

// The source lists every court decision the same way. These are not criminal convictions: `amount` is then what the
// person was ordered to pay (damages, costs), not a fine. Anything left out counts as criminal.
const NATURE = {
  'Q5829:2023-07-01': 'civil', // Copyright, "La Marianne asiatique"
  'Q288477:2026-01-16': 'civil', // Copyright, "Le Collège d'à côté"
  'Q288477:2022-03-04': 'civil', // Copyright, candidacy clip
  'Q41102798:2020-11-30': 'civil', // Presumption of innocence, Tariq Ramadan
  'Q3090373:2025-09-01': 'civil', // Employment tribunal
  'Q112651467:2023-07-04': 'civil', // Abusive civil-party claim
  'Q30525139:2020-10-15': 'civil', // Personal bankruptcy
  'Q2851582:2024-09-01': 'electoral', // Campaign accounts, Conseil constitutionnel
  'Q30343090:2021-01-01': 'electoral', // Campaign accounts, 2020 municipal election
}

// Errors checked against the press. null removes a decision that is not this person's; the object replaces fields.
const CORRECTIONS = {
  // The party was convicted in the "kits de campagne" case, not Marine Le Pen in person
  'Q12927:2020-06-16': null,
  // The source gives the wrong grounds (undeclared conflicts of interest): the Conseil ruled on the campaign account
  'Q2851582:2024-09-01': {
    date: '2024-09-13',
    title: 'Compte de campagne des sénatoriales de 2023',
    offence: 'Rejet du compte de campagne',
    description:
      "Compte de campagne rejeté faute de compte bancaire ouvert pour la campagne. Le Conseil constitutionnel l'a déclarée inéligible pour un an et démissionnaire d'office. Elle a été réélue sénatrice en septembre 2025.",
    otherPenalty: "Déclarée démissionnaire d'office",
    source: {
      label: 'Public Sénat',
      url: 'https://www.publicsenat.fr/actualites/institutions/la-senatrice-annick-girardin-declaree-ineligible-par-le-conseil-constitutionnel',
    },
  },
  // Snapshot stopped at the first judgment; appeal ruling of 7 July 2026, followed by an appeal to the Cour de cassation
  'Q41102798:2025-03-31': {
    date: '2026-07-07',
    status: 'cassation',
    prison: [8, 8],
    ineligibility: [12, 12],
    source: {
      label: 'LCP',
      url: 'https://lcp.fr/actualites/julien-odoul-condamne-en-appel-dans-l-affaire-des-assistants-parlementaires-du-fn',
    },
  },
}

// A conviction known to be amnestied, with the law; none is documented so far. Pardons stay in `otherPenalty`.
const AMNESTIES = {}

// People whose decisions were read when filling NATURE: anyone else matching a page gets a build warning
const REVIEWED = new Set([
  'Q5829', 'Q288477', 'Q12927', 'Q2851133', 'Q29575749', 'Q116870344', 'Q112640278', 'Q30349862', 'Q30378055',
  'Q30343090', 'Q112651467', 'Q3193433', 'Q30525139', 'Q30349300', 'Q984375', 'Q32979246', 'Q19606880', 'Q17632457',
  'Q63313476', 'Q41102798', 'Q110934545', 'Q37946793', 'Q112653386', 'Q3090373', 'Q40954423', 'Q2851582', 'Q3166376',
])

const { people } = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))

const byName = new Map()
for (const p of people) {
  const k = normalizeName(p.name.replace(/\s*\(.*\)$/, ''))
  byName.set(k, [...(byName.get(k) ?? []), p])
}

function decisions(person) {
  const out = []
  for (const raw of person.convictions) {
    const key = `${person.id}:${raw.date}`
    const correction = CORRECTIONS[key]
    if (correction === null) continue
    const c = { ...raw, ...correction }
    const [prison, suspendedPrison] = c.prison
    const [amount, suspendedAmount] = c.fine
    const [ineligibility, suspendedIneligibility] = c.ineligibility
    out.push({
      date: c.date,
      title: c.title,
      offence: c.offence,
      description: c.description,
      status: STATUS[c.status] ?? c.status,
      nature: NATURE[key] ?? 'criminal',
      prisonMonths: { total: prison, suspended: suspendedPrison },
      amount: { total: amount, suspended: suspendedAmount, currency: c.currency === 'franc' ? 'FRF' : 'EUR' },
      ineligibilityMonths: { total: ineligibility, suspended: suspendedIneligibility },
      otherPenalty: c.otherPenalty,
      amnesty: AMNESTIES[key] ?? null,
      source: c.source ?? { label: 'Wikipédia', url: person.wikipedia },
    })
  }
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Sets `convictions` on every person, matched on full name. A birth date, when both sides have one, must agree: two
 * people can share a name, and naming the wrong one here would be serious.
 */
export function attachConvictions(list, page) {
  for (const person of list) {
    const found = (byName.get(normalizeName(person.firstName + person.lastName)) ?? []).filter(
      (p) => !person.birthDate || !p.birthDate || p.birthDate === person.birthDate,
    )
    if (found.length > 1) throw new Error(`${page}: homonyms in Casier Politique for ${person.firstName} ${person.lastName}`)
    const [match] = found
    if (match && !REVIEWED.has(match.id))
      console.warn(`! ${page}: ${match.name} (${match.id}) is new in Casier Politique: review NATURE in convictions.mjs`)
    person.convictions = match ? decisions(match) : []
  }
  const concerned = list.filter((p) => p.convictions.length).length
  console.log(`  Casier Politique: ${concerned} of ${list.length} with at least one decision`)
}
