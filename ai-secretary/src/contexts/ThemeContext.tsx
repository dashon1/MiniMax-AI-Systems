import { createContext, useContext } from 'react'
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes'

interface ThemeContextType {
  theme: string | undefined
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      {...({
        attribute: "class",
        defaultTheme: "light",
        enableSystem: true,
        disableTransitionOnChange: false,
        children
      } as any)}
    />
  )
}

export function useTheme() {
  return useNextTheme()
}
