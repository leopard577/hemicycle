import { useState } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { chooseTheme, currentTheme } from '@/lib/theme'

/** Switches between the light and dark themes */
export function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme)
  const dark = theme === 'dark'
  const label = dark ? 'Passer en thème clair' : 'Passer en thème sombre'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = dark ? 'light' : 'dark'
        chooseTheme(next)
        setTheme(next)
      }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
