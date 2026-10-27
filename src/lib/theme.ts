// Thème clair ou sombre. Sans choix enregistré, on suit la préférence système ; le choix fait avec le
// bouton est mémorisé dans le navigateur. Le thème sombre de shadcn s'active via la classe `.dark`.
const CLE = 'theme'
const systemeSombre = window.matchMedia('(prefers-color-scheme: dark)')

export type Theme = 'clair' | 'sombre'

function choixEnregistre(): Theme | null {
  try {
    const v = localStorage.getItem(CLE)
    return v === 'clair' || v === 'sombre' ? v : null
  } catch {
    return null
  }
}

export const themeActuel = (): Theme => choixEnregistre() ?? (systemeSombre.matches ? 'sombre' : 'clair')

const appliquer = () => document.documentElement.classList.toggle('dark', themeActuel() === 'sombre')

export function choisirTheme(theme: Theme) {
  try {
    localStorage.setItem(CLE, theme)
  } catch {
    // Stockage indisponible (navigation privée…) : le choix vaut pour la page en cours
  }
  document.documentElement.classList.toggle('dark', theme === 'sombre')
}

/** À appeler une fois au démarrage */
export function initTheme() {
  appliquer()
  systemeSombre.addEventListener('change', appliquer)
}
