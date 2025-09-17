import { useAuth } from '@/contexts/AuthContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { RedesignedAuthPage } from '@/components/RedesignedAuthPage'
import { Dashboard } from '@/components/Dashboard'
import { AdminRoute } from '@/components/AdminRoute'
import { AdminLayout } from '@/components/AdminLayout'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { AdminUsers } from '@/pages/AdminUsers'
import { AdminAgents } from '@/pages/AdminAgents'
import { AdminCredits } from '@/pages/AdminCredits'
import { UserDashboard } from '@/pages/UserDashboard'
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">Loading AEROS Platform...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <RedesignedAuthPage />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
      <Route path="/user" element={user ? <UserDashboard /> : <Navigate to="/" replace />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="agents" element={<AdminAgents />} />
        <Route path="credits" element={<AdminCredits />} />
        <Route path="analytics" element={<AdminDashboard />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <Router>
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
            </Router>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
