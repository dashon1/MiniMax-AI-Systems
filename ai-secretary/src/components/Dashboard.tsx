import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TaskSubmission } from '@/components/TaskSubmission'
import { TaskHistory } from '@/components/TaskHistory'
import { AgentOverview } from '@/components/AgentOverview'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, User, BarChart3, Bot, MessageSquare, Clock } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Secretary</h1>
              <p className="text-sm text-muted-foreground">Intelligent task routing for AI agents</p>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Submit Task
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <AgentOverview />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TaskSubmission />
              <div className="lg:max-h-[600px] lg:overflow-hidden">
                <TaskHistory />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="submit">
            <TaskSubmission />
          </TabsContent>
          
          <TabsContent value="history">
            <TaskHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}