// Light or dark theme. With no saved choice the system preference applies; the choice made with the
// button is saved in the browser. shadcn's dark theme is enabled by the `.dark` class.
const KEY = 'theme'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

export type Theme = 'light' | 'dark'

// Values saved before the code switched to English
const LEGACY: Record<string, Theme> = { clair: 'light', sombre: 'dark' }

function savedChoice(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : (LEGACY[v ?? ''] ?? null)
  } catch {
    return null
  }
}

export const currentTheme = (): Theme => savedChoice() ?? (systemDark.matches ? 'dark' : 'light')

const apply = () => document.documentElement.classList.toggle('dark', currentTheme() === 'dark')

export function chooseTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Storage unavailable (private browsing…): the choice holds for the current page
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Call once at startup */
export function initTheme() {
  apply()
  systemDark.addEventListener('change', apply)
}
