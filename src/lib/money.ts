// What a parliamentarian costs and what they hold on top of their mandate, from public data only.
// Everything is computed client side from the page dataset: nothing is invented or estimated beyond the
// official pay scales.
import { ASSETS, declarationsOf, INTERESTS } from '@/lib/declarations'
import { formatDate } from '@/lib/format'
import type { Office } from '@/lib/offices'
import type { Income, LocalMandate, Official, Parliamentarian, PayScales } from '@/types'

/* ---------- Seat cost ---------- */

export interface MonthlyCost {
  allowance: number
  special: number
  expenses: number
  staff: number
  total: number
}

/** Monthly amounts tied to a seat, according to the chamber's pay scales */
export function monthlyCost(member: Parliamentarian, payScales: PayScales): MonthlyCost {
  const allowance = payScales.allowance.gross
  const special = member.specialAllowances.reduce((sum, s) => sum + s.amount, 0)
  const expenses = payScales.expenseAllowance
  const staff = payScales.staffBudget
  return { allowance, special, expenses, staff, total: allowance + special + expenses + staff }
}

const MS_PER_MONTH = (365.25 / 12) * 86_400_000

/** Amount accumulated since taking office, prorated to the time elapsed */
export function sinceStart(monthly: number, startDate: string, now = Date.now()) {
  return Math.max(0, ((now - new Date(startDate).getTime()) / MS_PER_MONTH) * monthly)
}

/* ---------- Declared income ---------- */

export type Category = 'deputy' | 'european' | 'senate' | 'government' | 'local' | 'private' | 'consulting' | 'director'

// Classes written in full so that Tailwind detects them
export const CATEGORIES: Record<Category, { label: string; fill: string; bg: string }> = {
  deputy: { label: 'Mandat de député', fill: 'fill-slate-400', bg: 'bg-slate-400' },
  european: { label: 'Parlement européen', fill: 'fill-blue-600', bg: 'bg-blue-600' },
  senate: { label: 'Sénat', fill: 'fill-indigo-400', bg: 'bg-indigo-400' },
  government: { label: 'Fonction gouvernementale', fill: 'fill-sky-700', bg: 'bg-sky-700' },
  local: { label: 'Mandats locaux', fill: 'fill-amber-500', bg: 'bg-amber-500' },
  private: { label: 'Activités professionnelles', fill: 'fill-emerald-600', bg: 'bg-emerald-600' },
  consulting: { label: 'Activités de conseil', fill: 'fill-fuchsia-600', bg: 'bg-fuchsia-600' },
  director: { label: 'Fonctions de dirigeant', fill: 'fill-rose-600', bg: 'bg-rose-600' },
}

export const CATEGORY_ORDER = Object.keys(CATEGORIES) as Category[]

const normalize = (s: string | null) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Ministers often declare their ministerial pay as a job, or even as a mandate
const GOVERNMENT_ROLE = /^\s*((premier|premiere) ministre|ministre|secretaire d.etat|garde des sceaux|porte-parole du gouvernement)/

/** Category of a declared line, from its free-text title: parliamentary mandates and government roles */
function mandateCategory(i: Income): Category | null {
  const t = normalize(i.title)
  if (GOVERNMENT_ROLE.test(t)) return 'government'
  if (/europ/.test(t) && /deput|parlement/.test(t)) return 'european'
  if (/senat/.test(t)) return 'senate'
  if (/^\s*deput/.test(t)) return 'deputy'
  return null
}

export interface IncomeLine {
  income: Income
  category: Category
  /** Activity with no end date, or ended after taking office */
  ongoing: boolean
  /** Latest published yearly amount */
  latest: { year: number; amount: number } | null
  /** Same amounts as in another section: income declared twice, counted once */
  duplicate: boolean
}

// "07/2024" → "2024-07"
const isoMonth = (v: string | null) => {
  const m = /(\d{1,2})\/(\d{4})/.exec(v ?? '')
  return m ? `${m[2]}-${m[1].padStart(2, '0')}` : null
}

export function incomeLines(official: Official): IncomeLine[] {
  const interests = official.hatvp.interests
  if (!interests) return []
  const mandateStart = official.startDate.slice(0, 7)
  const sources: [Income[] | null, Category][] = [
    [interests.mandates, 'local'],
    [interests.jobs, 'private'],
    [interests.consulting, 'consulting'],
    [interests.directorships, 'director'],
  ]
  // A company the official runs often also appears as a job, with the same latest amount:
  // the second occurrence is flagged as a duplicate
  const seen = new Map<string, Category>()
  return sources.flatMap(([items, fallback]) =>
    (items ?? []).map((income) => {
      const end = isoMonth(income.end)
      const published = income.amounts.filter((m): m is { year: number; amount: number } => m.amount !== null)
      const latest = published.sort((a, b) => b.year - a.year)[0] ?? null
      const fingerprint = latest && latest.amount > 0 && fallback !== 'local' ? `${latest.year}:${latest.amount}` : null
      const already = fingerprint ? seen.get(fingerprint) : undefined
      if (fingerprint && !already) seen.set(fingerprint, fallback)
      return {
        income,
        category: mandateCategory(income) ?? fallback,
        ongoing: end === null || end > mandateStart,
        latest,
        duplicate: already !== undefined && already !== fallback,
      }
    }),
  )
}

export interface YearIncome {
  year: number
  parts: Partial<Record<Category, number>>
  total: number
}

/** Declared income, summed by year and category */
export function incomeByYear(lines: IncomeLine[]): YearIncome[] {
  const years = new Map<number, YearIncome>()
  // Same amount the same year in another private section: income declared twice
  const privateAmounts = new Map<string, Category>()
  for (const { income, category } of lines) {
    for (const { year, amount } of income.amounts) {
      if (!amount) continue
      if (category === 'private' || category === 'consulting' || category === 'director') {
        const already = privateAmounts.get(`${year}:${amount}`)
        if (already && already !== category) continue
        privateAmounts.set(`${year}:${amount}`, category)
      }
      const y = years.get(year) ?? { year, parts: {}, total: 0 }
      y.parts[category] = (y.parts[category] ?? 0) + amount
      y.total += amount
      years.set(year, y)
    }
  }
  return [...years.values()].sort((a, b) => a.year - b.year)
}

/** What the official declares earning on top of their allowance, for the latest published year */
export function sideIncome(lines: IncomeLine[], office: Office) {
  const side = lines.filter((l) => l.ongoing && !office.ownCategories.includes(l.category))
  const sum = (ls: IncomeLine[]) => ls.reduce((total, l) => total + (l.duplicate ? 0 : (l.latest?.amount ?? 0)), 0)
  return { lines: side, total: sum(side), local: sum(side.filter((l) => l.category === 'local')) }
}

/* ---------- Local mandates (RNE) and declarations ---------- */

const KEYWORDS: Record<LocalMandate['type'], RegExp> = {
  municipal: /municip|maire|adjoint|conseil(ler|lere)? de paris/,
  district: /arrondissement|municip/,
  intercommunal: /communaut|metropol|agglo|epci|intercommun|territoire|\bcc\b|\bca\b/,
  departmental: /departem|general|\bcd\b|alsace|conseil(ler|lere)? d.alsace/,
  regional: /region|\bcr\b/,
  territorial: /metropol|congres|assemblee|territori|corse|polynesie|guyane|martinique|collectivite/,
  european: /europ/,
}

const STOP_WORDS = new Set(['saint', 'sainte', 'sous', 'pays', 'metropole', 'communaute', 'communes'])

const placeWords = (place: string | null) =>
  normalize(place)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t))

/** Is the RNE mandate among the declared elected mandates (ongoing when the RNE mandate started)? */
export function isMandateDeclared(m: LocalMandate, declared: Income[]) {
  const start = m.start?.slice(0, 7) ?? ''
  const words = placeWords(m.place)
  return declared.some((i) => {
    const end = isoMonth(i.end)
    if (end !== null && end < start) return false
    const t = normalize(`${i.title} ${i.organization}`)
    return KEYWORDS[m.type].test(t) || words.some((w) => t.includes(w))
  })
}

const EXECUTIVE_ROLE = /maire|adjoint|president|organe executif/

export const isExecutive = (m: LocalMandate) => EXECUTIVE_ROLE.test(normalize(m.role))

/** Role to display: the RNE writes "Autre membre" or "Membre" for a plain councillor */
export const displayedRole = (m: LocalMandate) =>
  m.role && !/^(autre )?membre$/.test(normalize(m.role).trim()) ? m.role : null

/* ---------- Alerts ---------- */

export type Severity = 'serious' | 'warning' | 'info'

export interface Alert {
  severity: Severity
  title: string
  detail: string
}

const DAY = 86_400_000
const days = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY)

/** Two-month legal deadline to file a declaration after taking office or after a change */
export function legalDeadline(iso: string) {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + 2)
  return d
}

/** End of the legal deadline to file after taking office, as an ISO date, or null once it has passed */
export function pendingDeadline(startDate: string, now = Date.now()) {
  const due = legalDeadline(startDate)
  return due.getTime() > now ? due.toISOString().slice(0, 10) : null
}

/** Legal deadline plus a week of tolerance (filed on the Monday after a weekend…) */
const deadline = (iso: string) => legalDeadline(iso).getTime() + 7 * DAY

const frDate = (iso: string | null) => formatDate(iso) ?? 'date inconnue'

const mandateTitle = (m: LocalMandate) => `${displayedRole(m) ?? m.label}${m.place ? ` (${m.place})` : ''}`

const lowercaseRole = (m: LocalMandate) => {
  const r = displayedRole(m) ?? m.label
  return r.charAt(0).toLowerCase() + r.slice(1)
}

/**
 * Verifiable facts from crossing AN × HATVP × RNE. Every alert quotes its dates:
 * it describes a situation without presuming whether it is justified.
 */
export function alerts(official: Official, office: Office, now = Date.now()): Alert[] {
  const result: Alert[] = []
  const { interests, declarations } = official.hatvp

  // 1. Local executive roles, incompatible with a parliamentary mandate since 2017 (no such rule for ministers)
  for (const m of office.localExecutiveBanned ? official.localMandates.filter(isExecutive) : []) {
    const roleStart = m.roleStart ?? m.start
    const overlapStart = [official.startDate, roleStart ?? ''].sort().at(-1)!
    const observed = m.updatedAt ? days(overlapStart, m.updatedAt) : -1
    result.push(
      observed > 30
        ? {
            severity: 'serious',
            title: `Également ${lowercaseRole(m)}${m.place ? ` (${m.place})` : ''}`,
            detail: `D'après le Répertoire national des élus, mis à jour le ${frDate(m.updatedAt)}, cette fonction est occupée depuis le ${frDate(roleStart)}, soit depuis ${observed} jours en même temps que ${office.mandate.the}. La loi interdit à un ${office.noun} d'être aussi maire, adjoint au maire, ou président ou vice-président d'une collectivité ou d'une intercommunalité. Un élu dans ce cas a 30 jours pour abandonner l'une des deux fonctions.`,
          }
        : {
            severity: 'info',
            title: `Également ${lowercaseRole(m)}${m.place ? ` (${m.place})` : ''}`,
            detail: `D'après le Répertoire national des élus, cette fonction est occupée depuis le ${frDate(roleStart)}. La loi interdit de la cumuler avec ${office.mandate.the}, mais le délai de 30 jours pour choisir n'était pas encore écoulé à la date du fichier (${frDate(m.updatedAt)}).`,
          },
    )
  }

  // 2. Current local mandates missing from the declaration of interests
  if (interests?.mandates && interests.filedAt) {
    const { mandates, filedAt } = interests
    const missing = official.localMandates.filter(
      (m) => m.type !== 'intercommunal' && m.start && m.start < filedAt && !isMandateDeclared(m, mandates),
    )
    if (missing.length)
      result.push({
        severity: 'warning',
        title:
          missing.length > 1
            ? `${missing.length} mandats locaux non retrouvés dans sa déclaration d'intérêts`
            : "Mandat local non retrouvé dans sa déclaration d'intérêts",
        detail: `${missing.map((m) => `${mandateTitle(m)}, depuis le ${frDate(m.start)}`).join(' ; ')}. ${
          missing.length > 1
            ? 'Ces mandats figurent au Répertoire national des élus, mais pas'
            : 'Ce mandat figure au Répertoire national des élus, mais pas'
        } dans la liste des mandats de sa déclaration d'intérêts du ${frDate(filedAt)}.`,
      })
  }

  // 3. New local mandate with no amended declaration within two months
  const lastInterests = declarationsOf(declarations, INTERESTS)
    .map((d) => d.filedAt)
    .filter((d): d is string => d !== null)
    .sort()
    .at(-1)
  if (interests?.mandates && lastInterests) {
    const { mandates } = interests
    const undeclared = official.localMandates.filter(
      (m) =>
        m.start &&
        m.start > lastInterests &&
        deadline(m.start) < now &&
        // Re-election to a mandate already declared is not a change
        !isMandateDeclared(m, mandates),
    )
    if (undeclared.length)
      result.push({
        severity: 'warning',
        title: undeclared.length > 1 ? 'Nouveaux mandats non déclarés' : 'Nouveau mandat non déclaré',
        detail: `${undeclared.map((m) => `${mandateTitle(m)}, depuis le ${frDate(m.start)}`).join(' ; ')}. Sa dernière déclaration d'intérêts date du ${frDate(lastInterests)}, ${undeclared.length > 1 ? 'avant ces mandats' : 'avant ce mandat'}. La loi impose de signaler tout changement important à la HATVP dans les deux mois.`,
      })
  }

  // 4. Entry declarations filed late or missing. A presidential candidate files before the election: any
  // declaration counts then, whatever its date
  const entryFrom = office.declaresBeforeOffice ? '' : official.startDate
  for (const [types, name] of [
    [INTERESTS, "d'intérêts"],
    [ASSETS, 'de patrimoine'],
  ] as const) {
    const sinceStartDates = declarationsOf(declarations, types)
      .map((d) => d.filedAt)
      .filter((d): d is string => d !== null && d >= entryFrom)
      .sort()
    const limit = deadline(official.startDate)
    if (!sinceStartDates.length) {
      // A re-elected parliamentarian can be exempt from a new asset declaration: only a missing declaration of
      // interests is flagged
      if (limit < now && types === INTERESTS)
        result.push({
          severity: 'serious',
          title: `Aucune déclaration ${name} depuis son entrée en fonction`,
          detail: `En fonction depuis le ${frDate(official.startDate)}, aucune déclaration n'est enregistrée par la HATVP, alors que la loi laisse deux mois pour la déposer.`,
        })
      continue
    }
    if (new Date(sinceStartDates[0]).getTime() > limit)
      result.push({
        severity: 'warning',
        title: `Déclaration ${name} déposée en retard`,
        detail: `Déposée le ${frDate(sinceStartDates[0])}, soit ${days(official.startDate, sinceStartDates[0])} jours après son entrée en fonction le ${frDate(official.startDate)}, alors que la loi laisse deux mois.`,
      })
  }

  // 5. Unpublished amounts for ongoing activities
  const withoutAmount = incomeLines(official).filter(
    (l) => l.ongoing && !office.ownCategories.includes(l.category) && l.income.amounts.some((m) => m.amount === null),
  )
  if (withoutAmount.length)
    result.push({
      severity: 'info',
      title: 'Montants non publiés',
      detail: `${withoutAmount.map((l) => l.income.title ?? 'Activité').join(', ')} : au moins un montant annuel n'est pas rendu public dans sa déclaration.`,
    })

  const order: Record<Severity, number> = { serious: 0, warning: 1, info: 2 }
  return result.sort((a, b) => order[a.severity] - order[b.severity])
}

/* ---------- Summary used to colour the hemicycle ---------- */

export interface Summary {
  sideIncome: number
  /** Current local mandates (RNE) and ongoing paid activities declared */
  overlaps: number
  serious: number
  warnings: number
  /** Total value of the company holdings listed in the declaration of interests */
  capital: number
}

export function summary(official: Official, office: Office, now = Date.now()): Summary {
  const side = sideIncome(incomeLines(official), office)
  const paid = side.lines.filter((l) => l.category !== 'local' && (l.latest?.amount ?? 0) > 0).length
  const all = alerts(official, office, now)
  return {
    sideIncome: side.total,
    overlaps: official.localMandates.filter((m) => m.type !== 'intercommunal').length + paid,
    serious: all.filter((a) => a.severity === 'serious').length,
    warnings: all.filter((a) => a.severity === 'warning').length,
    capital: (official.hatvp.interests?.holdings ?? []).reduce((sum, h) => sum + (h.value ?? 0), 0),
  }
}
