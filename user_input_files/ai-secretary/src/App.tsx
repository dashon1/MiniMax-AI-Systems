import { useAuth } from '@/contexts/AuthContext'
import { AuthProvider } from '@/contexts/AuthContext'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading AI Secretary...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthPage />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App