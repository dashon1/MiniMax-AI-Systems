import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TaskSubmission } from '@/components/TaskSubmission'
import { TaskHistory } from '@/components/TaskHistory'
import { AgentOverview } from '@/components/AgentOverview'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { GamificationDashboard } from '@/components/GamificationDashboard'
import { AIWelcomeBanner } from '@/components/welcome/AIWelcomeBanner'
import { AchievementNotification } from '@/components/gamification/AchievementNotification'
import { NeuralBackground } from '@/components/ui/neural-background'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, User, BarChart3, Bot, MessageSquare, Clock, Trophy, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative">
      {/* Neural background */}
      <NeuralBackground variant="subtle" color="multi" className="fixed inset-0" />
      
      {/* Achievement notifications */}
      <AchievementNotification />
      
      {/* Header */}
      <motion.header 
        className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-40 relative"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header neural pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />
        
        <div className="container mx-auto px-4 py-4 relative">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Bot className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Super Agent
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Powered by Neural Network Orchestration
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <ThemeToggle />
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-lg">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative">
        {/* AI Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <AIWelcomeBanner className="mb-8" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-card/80 backdrop-blur-sm border border-border/50">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20"
              >
                <Bot className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="gamification" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20"
              >
                <Trophy className="h-4 w-4" />
                AI Mastery
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="submit" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20"
              >
                <MessageSquare className="h-4 w-4" />
                Submit Task
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-teal-500/20"
              >
                <Clock className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <AgentOverview />
              </motion.div>
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TaskSubmission />
                <div className="lg:max-h-[600px] lg:overflow-hidden">
                  <TaskHistory />
                </div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="gamification">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <GamificationDashboard />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AnalyticsDashboard />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="submit">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <TaskSubmission />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="history">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <TaskHistory />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}