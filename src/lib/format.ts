const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const euroFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
const euroCompactFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' })
const euroRoundFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function formatDate(iso: string | null) {
  // "1er juillet", not "1 juillet"
  return iso ? dateFmt.format(new Date(iso)).replace(/^1 /, '1er ') : null
}

export function formatEuro(n: number, { round = false, compact = false } = {}) {
  return (compact ? euroCompactFmt : round ? euroRoundFmt : euroFmt).format(n)
}

/** "juin 2024" */
export function formatMonth(iso: string | null) {
  return iso ? monthFmt.format(new Date(iso)) : null
}

export function age(iso: string | null) {
  if (!iso) return null
  const birth = new Date(iso)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--
  return years
}
