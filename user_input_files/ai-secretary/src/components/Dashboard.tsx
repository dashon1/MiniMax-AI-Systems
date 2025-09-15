import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { TaskSubmission } from '@/components/TaskSubmission'
import { TaskHistory } from '@/components/TaskHistory'
import { AgentOverview } from '@/components/AgentOverview'
import { LogOut, User, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

export function Dashboard() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AI Secretary</h1>
              <p className="text-sm text-slate-600">Intelligent task routing for AI agents</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Agent Overview */}
        <AgentOverview />
        
        {/* Task Submission */}
        <TaskSubmission />
        
        {/* Task History */}
        <TaskHistory />
      </main>
    </div>
  )
}