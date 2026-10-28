// "Candidats" page: the 2022 presidential election. Who stood (Conseil constitutionnel), their sponsorships
// (Conseil constitutionnel open data), their votes (ministère de l'Intérieur) and what their campaign cost the
// State (CNCCFP decisions on the campaign accounts).
//
// The CNCCFP publishes its decisions in the Journal officiel only, as text: the figures of each account are
// copied by hand below. The build checks them against the legal refund formula and fails on any mismatch.
import { presidentialFunding2022 as funding, householdWealth } from './pay-scales.mjs'
import { download, normalizeName, parseQuotedCsv } from './lib/util.mjs'

// Every sponsorship validated by the Conseil constitutionnel, final publication of 7 March 2022 (UTF-8, `;`)
const SPONSORSHIPS_URL =
  'https://static.data.gouv.fr/resources/parrainages-des-candidats-a-lelection-presidentielle-francaise-de-2022/20220307-183308/parrainagestotal.csv'
// Final national results of each round (cp1252, `;`, one row with a block of 7 columns per candidate)
const RESULTS_URLS = {
  first:
    'https://static.data.gouv.fr/resources/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-1er-tour/20220414-152200/resultats-par-niveau-fe-t1-france-entiere.txt',
  second:
    'https://static.data.gouv.fr/resources/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-2nd-tour/20220428-141900/resultats-par-niveau-fe-t2-france-entiere.txt',
}

const DECISIONS = {
  list: {
    title: 'Décision n° 2022-187 PDR du 7 mars 2022 (liste des candidats)',
    date: '2022-03-07',
    url: 'https://www.conseil-constitutionnel.fr/decision/2022/2022187PDR.htm',
  },
  firstRound: {
    title: 'Déclaration n° 2022-195 PDR du 13 avril 2022 (résultats du premier tour)',
    date: '2022-04-13',
    url: 'https://www.conseil-constitutionnel.fr/decision/2022/2022195PDR.htm',
  },
  secondRound: {
    title: 'Décision n° 2022-197 PDR du 27 avril 2022 (proclamation des résultats)',
    date: '2022-04-27',
    url: 'https://www.conseil-constitutionnel.fr/decision/2022/2022197PDR.htm',
  },
}

const ROUND_DATES = { first: '2022-04-10', second: '2022-04-24' }

// data.gouv.fr pages of the downloaded files, linked from the page
const DATASETS = {
  sponsorships: {
    label: 'Parrainages des candidats à l’élection présidentielle de 2022 (Conseil constitutionnel)',
    url: 'https://www.data.gouv.fr/datasets/parrainages-des-candidats-a-lelection-presidentielle-francaise-de-2022',
  },
  firstRound: {
    label: 'Résultats définitifs du 1er tour (ministère de l’Intérieur)',
    url: 'https://www.data.gouv.fr/datasets/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-1er-tour',
  },
  secondRound: {
    label: 'Résultats définitifs du 2nd tour (ministère de l’Intérieur)',
    url: 'https://www.data.gouv.fr/datasets/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-2nd-tour',
  },
}

// All twelve decisions are dated 14 December 2022 and collected in this CNCCFP file
const DECISIONS_PDF = 'https://www.cnccfp.fr/wp-content/uploads/2023/02/cnccfp-decisions-presidentielle-2022.pdf'
const DECISION_DATE = '2022-12-14'

// Campaign accounts as settled by the CNCCFP, in euros, copied from article 1 (table "montants retenus"),
// the "droit au remboursement" paragraphs and article 2 of each decision:
// - declared / retained: total revenue and total spending subject to the ceiling, as filed and as settled;
// - personal: personal contribution retained ("apport personnel", 200,000 euro advance included);
// - partyPayments: final payments of parties to the agent; donations: gifts from individuals;
// - partyContributions: spending paid directly or in kind by parties (section II); inKind: other in-kind help;
// - entitlement: the lowest of the refund cap, the refundable spending and the personal contribution net of
//   any surplus, before deductions;
// - irregular: spending found irregular (posters outside official boards, vehicle wraps…), not refundable;
// - penalty: reduction decided for irregularities (art. L. 52-11-1 of the electoral code);
// - refund: amount owed by the State (article 2), the advance included.
// Lassalle's article 1 states 813,570 / 795,520 euros, but its table and paragraph 6 give 813,106 / 812,595: the
// table is kept.
const ACCOUNTS = [
  { name: 'ARTHAUD Nathalie', nor: 'CCCJ2300551S', declared: [893_158, 891_099], retained: [891_903, 889_844], personal: 788_745, partyPayments: 0, donations: 63_267, partyContributions: 6_325, inKind: 10_902, entitlement: 786_686, irregular: 0, penalty: 0, refund: 786_686 },
  { name: 'ROUSSEL Fabien', nor: 'CCCJ2300776S', declared: [4_072_001, 4_016_174], retained: [3_936_776, 3_880_949], personal: 976_461, partyPayments: 1_200_000, donations: 182_545, partyContributions: 1_431_008, inKind: 44_369, entitlement: 800_423, irregular: 45_537, penalty: 0, refund: 754_886 },
  { name: 'MACRON Emmanuel', nor: 'CCCJ2300780S', declared: [16_837_887, 16_699_980], retained: [16_673_510, 16_535_603], personal: 10_725_630, partyPayments: 566_609, donations: 605_853, partyContributions: 4_743_465, inKind: 2_153, entitlement: 10_587_723, irregular: 23_764, penalty: 100_000, refund: 10_463_959 },
  { name: 'LASSALLE Jean', nor: 'CCCJ2300783S', declared: [813_571, 813_060], retained: [813_106, 812_595], personal: 786_502, partyPayments: 0, donations: 0, partyContributions: 2_009, inKind: 0, entitlement: 785_991, irregular: 15_000, penalty: 0, refund: 770_991 },
  // Published by the Conseil constitutionnel (NOR CSCX…) in the JO of 24 February 2023
  { name: 'LE PEN Marine', nor: 'CSCX2305729S', publishedAt: '2023-02-24', declared: [12_195_243, 11_483_385], retained: [11_383_445, 10_671_587], personal: 11_248_882, partyPayments: 0, donations: 76_638, partyContributions: 36_551, inKind: 27, entitlement: 10_537_024, irregular: 316_182, penalty: 0, refund: 10_220_842 },
  { name: 'ZEMMOUR Éric', nor: 'CCCJ2300788S', declared: [11_309_839, 10_976_228], retained: [11_063_135, 10_826_804], personal: 10_085_302, partyPayments: 0, donations: 37_215, partyContributions: 501_103, inKind: 56_318, entitlement: 8_004_225, irregular: 0, penalty: 200_000, refund: 7_804_225 },
  { name: 'MÉLENCHON Jean-Luc', nor: 'CCCJ2300790S', declared: [14_084_387, 13_685_064], retained: [13_924_466, 13_519_579], personal: 8_059_303, partyPayments: 1_300_000, donations: 2_352_347, partyContributions: 2_173_284, inKind: 0, entitlement: 7_654_416, irregular: 9_630, penalty: 15_000, refund: 7_629_786 },
  { name: 'HIDALGO Anne', nor: 'CCCJ2300792S', declared: [3_775_041, 3_744_225], retained: [3_740_581, 3_709_765], personal: 965_428, partyPayments: 1_498_217, donations: 155_827, partyContributions: 1_117_728, inKind: 0, entitlement: 800_423, irregular: 0, penalty: 0, refund: 800_423 },
  { name: 'JADOT Yannick', nor: 'CCCJ2300796S', declared: [7_912_712, 5_162_965], retained: [5_017_327, 5_016_727], personal: 656_261, partyPayments: 3_049_830, donations: 1_300_738, partyContributions: 2_624, inKind: 0, entitlement: 655_661, irregular: 0, penalty: 4_000, refund: 651_661 },
  { name: 'PÉCRESSE Valérie', nor: 'CCCJ2300798S', declared: [14_324_135, 14_324_135], retained: [13_554_449, 13_554_449], personal: 805_842, partyPayments: 5_155_300, donations: 4_213_748, partyContributions: 3_375_325, inKind: 4_234, entitlement: 800_423, irregular: 0, penalty: 15_000, refund: 785_423 },
  { name: 'POUTOU Philippe', nor: 'CCCJ2300803S', declared: [823_150, 819_686], retained: [814_020, 810_556], personal: 800_870, partyPayments: 0, donations: 0, partyContributions: 13_150, inKind: 0, entitlement: 797_406, irregular: 0, penalty: 3_000, refund: 794_406 },
  { name: 'DUPONT-AIGNAN Nicolas', nor: 'CCCJ2300809S', declared: [878_544, 871_410], retained: [864_562, 857_428], personal: 737_018, partyPayments: 0, donations: 63_133, partyContributions: 48_367, inKind: 15_144, entitlement: 729_884, irregular: 0, penalty: 1_000, refund: 728_884 },
]

// Net worth of each candidate as reported by the press when the HATVP published their asset declarations. The
// declarations themselves were public only from 8 March 2022 to the first-round results (law no. 62-1292, art. 3)
// and are no longer online, so the page cites the article instead. Amounts as written in the article (rounded),
// assets minus debts as computed by franceinfo; keyed like ACCOUNTS. Added by decision of the project owner.
const PRESS_NET_WORTH = {
  source: {
    title: 'Présidentielle 2022 : consultez les déclarations de patrimoine et d’intérêts des 12 candidats à l’Elysée',
    publisher: 'franceinfo avec AFP',
    date: '2022-03-08',
    url: 'https://www.franceinfo.fr/politique/emmanuel-macron/presidentielle-2022-consultez-les-declarations-de-patrimoine-et-d-interets-des-12-candidats_4998801.html',
  },
  // Page of the HATVP explaining that the declarations stayed public until the first-round results
  removal: 'https://www.hatvp.fr/presse/presidentielle-2022-le-role-de-la-haute-autorite/',
  publishedFrom: '2022-03-08',
  publishedUntil: '2022-04-13',
  amounts: {
    'PÉCRESSE Valérie': 9_700_000,
    'ZEMMOUR Éric': 4_200_000,
    'DUPONT-AIGNAN Nicolas': 2_000_000,
    'MÉLENCHON Jean-Luc': 1_400_000,
    'LE PEN Marine': 1_200_000,
    'LASSALLE Jean': 630_000,
    'HIDALGO Anne': 575_000,
    'MACRON Emmanuel': 550_000,
    'JADOT Yannick': 412_000,
    'ROUSSEL Fabien': 220_000,
    'ARTHAUD Nathalie': 219_000,
    'POUTOU Philippe': 121_500,
  },
}

// Sponsors' offices ("Mandat" column), grouped; the first matching rule wins
const SPONSOR_OFFICES = [
  { id: 'mayor', test: /^Maire/ },
  { id: 'parliament', test: /^(Député|Sénat|Représentant)/ },
  { id: 'departmental', test: /départemental|de Paris|métropolitain de Lyon/ },
  { id: 'regional', test: /régional|Assemblée de Corse|outre-mer à statut particulier/ },
  { id: 'other', test: /./ },
]

const key = (s) => normalizeName(s)

/** "LE PEN" → "Le Pen", "DUPONT-AIGNAN" → "Dupont-Aignan" */
const properCase = (s) => s.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (c) => c.toUpperCase())

// "48747876" or "27,85" → number
const num = (s) => Number(s.replace(',', '.'))

/** One national results file: turnout and one entry per candidate */
function parseResults(text) {
  const [header, row] = text.split(/\r?\n/).filter(Boolean).map((l) => l.split(';'))
  const col = (name) => row[header.indexOf(name)]
  const fixed = header.indexOf('N°Panneau')
  const candidates = []
  for (let i = fixed; i + 6 < row.length; i += 7) {
    const [panel, sex, lastName, firstName, votes, , share] = row.slice(i, i + 7)
    candidates.push({ panel: Number(panel), sex, lastName, firstName, votes: num(votes), share: Number((num(share) / 100).toFixed(4)) })
  }
  return {
    registered: num(col('Inscrits')),
    voters: num(col('Votants')),
    blank: num(col('Blancs')),
    invalid: num(col('Nuls')),
    cast: num(col('Exprimés')),
    candidates,
  }
}

/** Downloads the sponsorships and the national results of both rounds */
export async function loadCandidates() {
  const decoder = new TextDecoder('windows-1252')
  const [sponsorships, first, second] = await Promise.all([
    download(SPONSORSHIPS_URL).then((r) => r.text()),
    download(RESULTS_URLS.first).then(async (r) => decoder.decode(await r.arrayBuffer())),
    download(RESULTS_URLS.second).then(async (r) => decoder.decode(await r.arrayBuffer())),
  ])
  return {
    sponsorships: parseQuotedCsv(sponsorships, ';'),
    rounds: { first: parseResults(first), second: parseResults(second) },
  }
}

/** Refund cap set by law: 47.5% of the ceiling that applies above 5% of the votes cast, 4.75% below */
function refundCap(firstRoundShare, inSecondRound) {
  const ceiling = inSecondRound ? funding.ceiling.secondRound : funding.ceiling.firstRound
  const rate = firstRoundShare > funding.highRateThreshold ? funding.refundRate.high : funding.refundRate.low
  return { ceiling, cap: Math.round(ceiling * rate) }
}

export function buildCandidates({ sponsorships, rounds }) {
  const accounts = new Map(ACCOUNTS.map((a) => [key(a.name), a]))
  const netWorth = new Map(Object.entries(PRESS_NET_WORTH.amounts).map(([name, amount]) => [key(name), amount]))
  const secondRound = new Map(rounds.second.candidates.map((c) => [key(c.lastName + c.firstName), c]))

  // Sponsorships per person named in the file, candidate or not
  const sponsorsOf = new Map()
  for (const row of sponsorships) {
    const k = key(row.Candidat)
    if (!sponsorsOf.has(k)) sponsorsOf.set(k, [])
    sponsorsOf.get(k).push(row)
  }

  const candidates = rounds.first.candidates.map((c) => {
    const k = key(c.lastName + c.firstName)
    const account = accounts.get(k)
    const sponsors = sponsorsOf.get(k)
    if (!account) throw new Error(`Candidates: no campaign account for ${c.firstName} ${c.lastName}`)
    if (!sponsors) throw new Error(`Candidates: no sponsorship for ${c.firstName} ${c.lastName}`)
    if (!netWorth.has(k)) throw new Error(`Candidates: no press net worth for ${c.firstName} ${c.lastName}`)

    const second = secondRound.get(k) ?? null
    const { ceiling, cap } = refundCap(c.share, second !== null)
    // The copied figures must follow the decision's own arithmetic
    if (account.entitlement > cap)
      throw new Error(`Candidates: ${account.name} entitlement ${account.entitlement} above the cap ${cap}`)
    if (account.entitlement - account.irregular - account.penalty !== account.refund)
      throw new Error(`Candidates: ${account.name} refund does not add up`)
    if (account.retained[1] > ceiling) throw new Error(`Candidates: ${account.name} spending above the ceiling`)

    const byOffice = Object.fromEntries(SPONSOR_OFFICES.map((o) => [o.id, 0]))
    for (const s of sponsors) byOffice[SPONSOR_OFFICES.find((o) => o.test.test(s.Mandat)).id]++

    return {
      id: k.toLowerCase(),
      honorific: c.sex === 'F' ? 'Mme' : 'M.',
      firstName: c.firstName,
      lastName: properCase(c.lastName),
      panel: c.panel,
      sponsorships: {
        total: sponsors.length,
        byOffice,
        departments: new Set(sponsors.map((s) => s.Département)).size,
      },
      firstRound: { votes: c.votes, share: c.share },
      secondRound: second && { votes: second.votes, share: second.share },
      pressNetWorth: netWorth.get(k),
      account: {
        declared: { revenue: account.declared[0], spending: account.declared[1] },
        retained: { revenue: account.retained[0], spending: account.retained[1] },
        personal: account.personal,
        partyPayments: account.partyPayments,
        donations: account.donations,
        partyContributions: account.partyContributions,
        inKind: account.inKind,
        ceiling,
        refundCap: cap,
        entitlement: account.entitlement,
        irregular: account.irregular,
        penalty: account.penalty,
        refund: account.refund,
        decision: {
          title: `Décision du 14 décembre 2022 relative au compte de campagne de ${c.sex === 'F' ? 'Mme' : 'M.'} ${c.firstName} ${c.lastName}`,
          date: DECISION_DATE,
          url: DECISIONS_PDF,
          nor: account.nor,
          publishedAt: account.publishedAt ?? '2023-01-27',
        },
      },
    }
  })
  if (candidates.length !== ACCOUNTS.length)
    throw new Error(`Candidates: ${candidates.length} candidates in the results, ${ACCOUNTS.length} accounts`)
  // Most votes first
  candidates.sort((a, b) => b.firstRound.votes - a.firstRound.votes)

  // People who received sponsorships without standing: counted, not named
  const standing = new Set(candidates.map((c) => key(c.lastName + c.firstName)))
  const others = [...sponsorsOf].filter(([k]) => !standing.has(k))

  const turnout = (r, date) => ({
    date,
    registered: r.registered,
    voters: r.voters,
    blank: r.blank,
    invalid: r.invalid,
    cast: r.cast,
  })

  const totalRefund = candidates.reduce((sum, c) => sum + c.account.refund, 0)
  console.log(`Candidates: ${candidates.length} candidates in 2022, ${sponsorships.length} sponsorships`)
  console.log(`  State refunds: ${totalRefund.toLocaleString('en')} euros`)

  return {
    election: {
      id: 'presidential-2022',
      label: 'Élection présidentielle 2022',
      decisions: DECISIONS,
      rounds: [turnout(rounds.first, ROUND_DATES.first), turnout(rounds.second, ROUND_DATES.second)],
      funding,
      datasets: DATASETS,
      pressNetWorth: {
        source: PRESS_NET_WORTH.source,
        removal: PRESS_NET_WORTH.removal,
        publishedFrom: PRESS_NET_WORTH.publishedFrom,
        publishedUntil: PRESS_NET_WORTH.publishedUntil,
        households: householdWealth,
      },
    },
    candidates,
    otherSponsored: {
      people: others.length,
      sponsorships: others.reduce((sum, [, rows]) => sum + rows.length, 0),
    },
    sponsorshipsTotal: sponsorships.length,
  }
}
