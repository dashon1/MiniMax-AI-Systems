import { useGamification } from '@/hooks/useGamification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AchievementBadge } from './AchievementBadge'
import { motion } from 'framer-motion'
import { Trophy, Target, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AchievementGridProps {
  className?: string
  showAll?: boolean
  maxVisible?: number
}

const categoryInfo = {
  orchestration: {
    icon: Zap,
    label: 'Orchestration',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10'
  },
  complexity: {
    icon: Target,
    label: 'Complexity',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10'
  },
  mastery: {
    icon: Star,
    label: 'Mastery',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10'
  },
  efficiency: {
    icon: Trophy,
    label: 'Efficiency',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10'
  }
}

export function AchievementGrid({ 
  className, 
  showAll = false, 
  maxVisible = 6 
}: AchievementGridProps) {
  const { stats } = useGamification()
  const { achievements } = stats
  
  const unlockedAchievements = achievements.filter(a => a.isUnlocked)
  const lockedAchievements = achievements.filter(a => !a.isUnlocked)
  
  const displayAchievements = showAll 
    ? achievements 
    : [...unlockedAchievements, ...lockedAchievements].slice(0, maxVisible)
    
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0)
  
  // Group achievements by category
  const groupedAchievements = displayAchievements.reduce((groups, achievement) => {
    const category = achievement.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(achievement)
    return groups
  }, {} as Record<string, typeof achievements>)

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                AI Achievements
              </CardTitle>
              <CardDescription>
                {unlockedAchievements.length} of {achievements.length} achievements unlocked
              </CardDescription>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {totalPoints}
              </div>
              <div className="text-xs text-muted-foreground">
                Achievement Points
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className={showAll ? 'h-96' : 'h-auto'}>
            <div className="space-y-6">
              {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
                const categoryData = categoryInfo[category as keyof typeof categoryInfo]
                const CategoryIcon = categoryData.icon
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-3"
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'p-1.5 rounded-md',
                        categoryData.bgColor
                      )}>
                        <CategoryIcon className={cn('h-4 w-4', categoryData.color)} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {categoryData.label}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {categoryAchievements.filter(a => a.isUnlocked).length}/{categoryAchievements.length}
                      </Badge>
                    </div>
                    
                    {/* Achievement badges */}
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {categoryAchievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.1 
                          }}
                        >
                          <AchievementBadge 
                            achievement={achievement}
                            size="sm"
                            showPoints
                            className="group relative"
                          />
                          
                          {/* Tooltip on hover */}
                          <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border max-w-48">
                            <div className="font-semibold">{achievement.title}</div>
                            <div className="text-muted-foreground">{achievement.description}</div>
                            {achievement.isUnlocked ? (
                              <div className="text-green-600 font-medium">Unlocked!</div>
                            ) : (
                              <div className="text-orange-600">
                                Requirement: {achievement.requirement.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
          
          {/* Progress summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {Object.entries(categoryInfo).map(([category, data]) => {
                const categoryAchievements = achievements.filter(a => a.category === category)
                const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length
                const percentage = (unlockedCount / categoryAchievements.length) * 100
                
                return (
                  <motion.div
                    key={category}
                    className="space-y-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={cn('p-2 rounded-lg', data.bgColor)}>
                      <data.icon className={cn('h-5 w-5 mx-auto', data.color)} />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-semibold">{data.label}</div>
                      <div className="text-muted-foreground">
                        {unlockedCount}/{categoryAchievements.length}
                      </div>
                      <div className={cn('text-xs font-bold', data.color)}>
                        {Math.round(percentage)}%
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AchievementGrid