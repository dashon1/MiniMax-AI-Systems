import { useGamification } from '@/hooks/useGamification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Brain, Crown, Zap, Star, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserLevelCardProps {
  className?: string
  showDetails?: boolean
}

export function UserLevelCard({ className, showDetails = true }: UserLevelCardProps) {
  const { stats, USER_LEVELS } = useGamification()
  const { currentLevel, totalPoints } = stats
  
  const nextLevel = USER_LEVELS.find(level => level.pointsRequired > totalPoints)
  const progressToNext = nextLevel 
    ? ((totalPoints - currentLevel.pointsRequired) / (nextLevel.pointsRequired - currentLevel.pointsRequired)) * 100
    : 100

  const levelIcons = {
    1: Brain,
    2: Zap,
    3: Star,
    4: Crown,
    5: Sparkles
  }

  const LevelIcon = levelIcons[currentLevel.level as keyof typeof levelIcons] || Brain

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/50">
        {/* Background neural network pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br',
            currentLevel.color
          )} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  'p-3 rounded-xl bg-gradient-to-br shadow-lg',
                  currentLevel.color
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <LevelIcon className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {currentLevel.title}
                  <Badge variant="outline" className="text-xs font-bold">
                    Level {currentLevel.level}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  {currentLevel.description}
                </CardDescription>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Intelligence Points
              </div>
            </div>
          </div>
        </CardHeader>
        
        {showDetails && (
          <CardContent className="relative space-y-4">
            {/* Progress to next level */}
            {nextLevel && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Progress to {nextLevel.title}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(progressToNext)}%
                  </span>
                </div>
                
                <div className="relative">
                  <Progress value={progressToNext} className="h-3" />
                  
                  {/* Neural pulse animation */}
                  <motion.div
                    className={cn(
                      'absolute top-0 h-3 rounded-full opacity-60',
                      'bg-gradient-to-r',
                      currentLevel.color
                    )}
                    style={{ width: `${progressToNext}%` }}
                    animate={{
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{totalPoints - currentLevel.pointsRequired} earned</span>
                  <span>{nextLevel.pointsRequired - totalPoints} needed</span>
                </div>
              </div>
            )}
            
            {/* Level 5 (max level) achievement */}
            {currentLevel.level === 5 && (
              <motion.div
                className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(251, 191, 36, 0)',
                    '0 0 0 8px rgba(251, 191, 36, 0.1)',
                    '0 0 0 0 rgba(251, 191, 36, 0)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                  Maximum Level Achieved!
                </span>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </motion.div>
            )}
            
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div 
                className="text-center p-2 bg-muted/50 rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold text-blue-600">
                  {stats.orchestrationStreak}
                </div>
                <div className="text-xs text-muted-foreground">
                  Success Streak
                </div>
              </motion.div>
              
              <motion.div 
                className="text-center p-2 bg-muted/50 rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold text-green-600">
                  {stats.agentMasteryScore}
                </div>
                <div className="text-xs text-muted-foreground">
                  Agent Mastery
                </div>
              </motion.div>
              
              <motion.div 
                className="text-center p-2 bg-muted/50 rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold text-purple-600">
                  {stats.taskComplexityScore}
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg Complexity
                </div>
              </motion.div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

export default UserLevelCard