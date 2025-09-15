import { useGamification } from '@/hooks/useGamification'
import { useTasks } from '@/hooks/useTasks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserLevelCard } from './gamification/UserLevelCard'
import { AchievementGrid } from './gamification/AchievementGrid'
import { AIProgressBar } from './gamification/AIProgressBar'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { NeuralBackground } from '@/components/ui/neural-background'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  Trophy,
  Activity,
  BarChart3
} from 'lucide-react'

interface GamificationDashboardProps {
  className?: string
}

export function GamificationDashboard({ className }: GamificationDashboardProps) {
  const { stats, calculateTaskComplexity, USER_LEVELS } = useGamification()
  const { tasks } = useTasks()
  
  // Calculate progress metrics
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const uniqueAgents = new Set(completedTasks.map(t => t.selected_agent))
  const totalComplexity = tasks.reduce((sum, task) => 
    sum + calculateTaskComplexity(task.task_content), 0
  )
  
  const averageComplexity = tasks.length > 0 ? totalComplexity / tasks.length : 0
  const nextLevelProgress = USER_LEVELS.find(level => level.pointsRequired > stats.totalPoints)
  const progressToNext = nextLevelProgress 
    ? ((stats.totalPoints - stats.currentLevel.pointsRequired) / 
       (nextLevelProgress.pointsRequired - stats.currentLevel.pointsRequired)) * 100
    : 100

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* User Level Card */}
          <UserLevelCard className="w-full" />
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AIGlowCard glowColor="blue" intensity="low" className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Intelligence Points</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalPoints.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </AIGlowCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AIGlowCard glowColor="green" intensity="low" className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Success Streak</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.orchestrationStreak}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </AIGlowCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AIGlowCard glowColor="purple" intensity="low" className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Agent Mastery</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.agentMasteryScore}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </AIGlowCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AIGlowCard glowColor="orange" intensity="low" className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Complexity</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(averageComplexity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </AIGlowCard>
            </motion.div>
          </div>
          
          {/* Quick Achievement Preview */}
          <AchievementGrid maxVisible={8} showAll={false} />
        </TabsContent>
        
        <TabsContent value="achievements">
          <AchievementGrid showAll={true} />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-6">
          {/* AI Progress Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIProgressBar
              title="Neural Network Training"
              description="AI orchestration expertise development"
              currentValue={stats.totalPoints}
              maxValue={nextLevelProgress?.pointsRequired || stats.currentLevel.pointsRequired + 1000}
              icon="brain"
              color="blue"
              showBadge
              badgeText={`Level ${stats.currentLevel.level}`}
            />
            
            <AIProgressBar
              title="Agent Synchronization"
              description="Multi-agent coordination mastery"
              currentValue={uniqueAgents.size}
              maxValue={4}
              icon="zap"
              color="green"
              showBadge
              badgeText={`${uniqueAgents.size}/4 agents`}
            />
            
            <AIProgressBar
              title="Task Complexity Matrix"
              description="Advanced problem-solving capability"
              currentValue={Math.round(averageComplexity)}
              maxValue={100}
              icon="target"
              color="purple"
              showBadge
              badgeText={`${Math.round(averageComplexity)}% complexity`}
            />
            
            <AIProgressBar
              title="Processing Efficiency"
              description="AI performance optimization level"
              currentValue={stats.orchestrationStreak}
              maxValue={25}
              icon="trending"
              color="orange"
              showBadge
              badgeText={`${stats.orchestrationStreak} streak`}
            />
          </div>
          
          {/* Detailed Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <NeuralBackground variant="subtle" color="multi" />
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Super Agent Progress
                </CardTitle>
                <CardDescription>
                  Your journey to becoming an AI orchestration master
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                {/* Level progression */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Level Progression</h3>
                  <div className="space-y-2">
                    {USER_LEVELS.map((level, index) => {
                      const isCompleted = stats.totalPoints >= level.pointsRequired
                      const isCurrent = level.level === stats.currentLevel.level
                      
                      return (
                        <motion.div
                          key={level.level}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isCurrent 
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {level.level}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                isCompleted || isCurrent 
                                  ? 'text-foreground' 
                                  : 'text-muted-foreground'
                              }`}>
                                {level.title}
                              </span>
                              {isCurrent && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {level.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {level.pointsRequired.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              points
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Weekly activity summary */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">This Week's AI Activity</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-blue-600">
                        {stats.weeklyProgress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tasks Orchestrated
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-green-600">
                        {stats.achievements.filter(a => a.isUnlocked).length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Achievements Unlocked
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(progressToNext)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Progress to Next Level
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GamificationDashboard