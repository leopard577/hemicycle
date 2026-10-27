const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const euroFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
const euroRoundFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function formatDate(iso: string | null) {
  return iso ? dateFmt.format(new Date(iso)) : null
}

export function formatEuro(n: number, { round = false } = {}) {
  return (round ? euroRoundFmt : euroFmt).format(n)
}

export function age(iso: string | null) {
  if (!iso) return null
  const birth = new Date(iso)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--
  return years
}
