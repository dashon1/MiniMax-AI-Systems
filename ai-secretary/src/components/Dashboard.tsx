import { useAuth } from '@/contexts/AuthContext'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TaskSubmission } from '@/components/TaskSubmission'
import { TaskHistory } from '@/components/TaskHistory'
import { AgentOverview } from '@/components/AgentOverview'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { GamificationDashboard } from '@/components/GamificationDashboard'
import { VoiceCommandCenter } from '@/components/VoiceCommandCenter'
import { SuperAgentCollectives } from '@/components/SuperAgentCollectives'
import { FloatingChatBot } from '@/components/FloatingChatBot'
import { AIWelcomeBanner } from '@/components/welcome/AIWelcomeBanner'
import { AchievementNotification } from '@/components/gamification/AchievementNotification'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { TierManagement } from '@/components/TierManagement'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, User, BarChart3, Bot, MessageSquare, Clock, Trophy, Sparkles, Mic, Users, Zap, Brain, Target, Shield, Crown, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdminAuth(user?.id)
  const { subscription, getRemainingCredits, getCreditUsagePercentage, isProTier } = useSubscription()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Agent session terminated')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }
  
  const handleVoiceTaskSubmit = (content: string, transcription?: string) => {
    // This would integrate with the existing task submission system
    console.log('Voice task submitted:', { content, transcription })
    toast.success('Voice command processed by Super Agent Group!')
  }

  return (
    <div className="min-h-screen bg-command-gradient relative overflow-hidden">
      {/* Command Center Background */}
      <CommandCenterBackground variant="dynamic" color="command" className="fixed inset-0" />
      
      {/* Neural Grid Pattern */}
      <div className="fixed inset-0 command-grid opacity-20 pointer-events-none" />
      
      {/* Achievement notifications */}
      <AchievementNotification />
      
      {/* Floating Chat Bot */}
      <FloatingChatBot />
      
      {/* Header */}
      <motion.header 
        className="border-b border-command-accent/30 bg-card/90 backdrop-blur-md sticky top-0 z-40 relative"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header command pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-command-accent/5 via-transparent to-command-success/5" />
        
        <div className="container mx-auto px-4 py-4 relative">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="relative p-3 bg-gradient-to-br from-command-accent to-command-success rounded-xl shadow-2xl"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-xl"
                    animate={{
                      opacity: [0, 0.5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  <Bot className="h-8 w-8 text-white relative z-10" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold command-title mb-1">
                    AEROS Neural Collective
                  </h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <motion.div
                        className="w-2 h-2 bg-command-success rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-command-success font-medium">8 Agent Brain Network Online</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-command-accent" />
                      <span className="text-muted-foreground">Unified Intelligence Platform</span>
                    </div>
                  </div>
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
              
              {/* Credit Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-card/60 backdrop-blur-sm rounded-lg border border-command-accent/20">
                <CreditCard className="h-4 w-4 text-command-accent" />
                <span>Credits:</span>
                <span className="font-mono text-command-accent">
                  {subscription ? `${getRemainingCredits()}/${subscription.credit_limit}` : '0/100'}
                </span>
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden ml-2">
                  <div 
                    className="h-full bg-command-accent rounded-full transition-all duration-300" 
                    style={{ width: `${subscription ? getCreditUsagePercentage() : 0}%` }} 
                  />
                </div>
                {isProTier() && (
                  <Crown className="h-3 w-3 text-yellow-400 ml-1" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-card/60 backdrop-blur-sm rounded-lg border border-command-accent/20">
                <Shield className="h-4 w-4 text-command-accent" />
                <span>Agent:</span>
                <span className="font-mono text-command-accent">{user?.email}</span>
              </div>
              
              {/* Navigation Links */}
              <Link 
                to="/user"
                className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-card/60 backdrop-blur-sm rounded-lg border border-command-accent/20 hover:bg-command-accent/10 hover:border-command-accent/40 transition-colors"
              >
                <Shield className="h-4 w-4 text-command-accent" />
                User Dashboard
              </Link>
              
              {isAdmin && (
                <Link 
                  to="/admin"
                  className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-card/60 backdrop-blur-sm rounded-lg border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-colors"
                >
                  <Shield className="h-4 w-4 text-yellow-500" />
                  Admin Panel
                </Link>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors border-command-danger/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Terminate Session
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
          <Tabs defaultValue="command" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-card/80 backdrop-blur-sm border-2 border-command-accent/20 h-14">
              <TabsTrigger 
                value="command" 
                className="flex flex-col items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-command-accent/20 data-[state=active]:to-command-success/20 data-[state=active]:text-command-accent"
              >
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Command</span>
              </TabsTrigger>
              <TabsTrigger 
                value="collectives" 
                className="flex flex-col items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-command-success/20 data-[state=active]:to-command-accent/20 data-[state=active]:text-command-success"
              >
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Collectives</span>
              </TabsTrigger>
              <TabsTrigger 
                value="voice" 
                className="flex flex-col items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-purple-400"
              >
                <Mic className="h-4 w-4" />
                <span className="text-xs font-medium">Voice</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tier" 
                className="flex flex-col items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-yellow-400"
              >
                <Crown className="h-4 w-4" />
                <span className="text-xs font-medium">Tier</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex flex-col items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20 data-[state=active]:text-orange-400"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="mastery" 
                className="flex flex-col items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-green-400"
              >
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">Mastery</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex flex-col items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-blue-400"
              >
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">History</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="command" className="space-y-6">
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
            
            <TabsContent value="collectives">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SuperAgentCollectives />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="voice">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <VoiceCommandCenter onTaskSubmit={handleVoiceTaskSubmit} />
                <div className="lg:max-h-[600px] lg:overflow-hidden">
                  <TaskHistory />
                </div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="tier">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <TierManagement />
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
            
            <TabsContent value="mastery">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <GamificationDashboard />
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