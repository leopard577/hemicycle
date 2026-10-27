import { useState } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { choisirTheme, themeActuel } from '@/lib/theme'

/** Bascule entre thème clair et thème sombre */
export function ThemeToggle() {
  const [theme, setTheme] = useState(themeActuel)
  const sombre = theme === 'sombre'
  const label = sombre ? 'Passer en thème clair' : 'Passer en thème sombre'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => {
        const suivant = sombre ? 'clair' : 'sombre'
        choisirTheme(suivant)
        setTheme(suivant)
      }}
    >
      {sombre ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
