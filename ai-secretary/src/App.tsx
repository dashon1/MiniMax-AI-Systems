import { useAuth } from '@/contexts/AuthContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthPage } from '@/components/AuthPage'
import { Dashboard } from '@/components/Dashboard'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground">Loading AI Secretary...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthPage />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'bg-card text-card-foreground border border-border',
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'hsl(var(--card-foreground))',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'hsl(var(--card-foreground))',
                },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App