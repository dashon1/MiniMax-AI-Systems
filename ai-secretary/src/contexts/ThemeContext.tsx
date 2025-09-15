import { createContext, useContext } from 'react'
import { ThemeProvider as NextThemeProvider } from 'next-themes'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemeProvider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  return context
}
