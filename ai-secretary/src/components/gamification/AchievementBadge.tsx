import { Achievement } from '@/hooks/useGamification'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
  showPoints?: boolean
  className?: string
}

const categoryColors = {
  orchestration: 'from-blue-500 to-blue-600',
  complexity: 'from-purple-500 to-purple-600',
  mastery: 'from-green-500 to-green-600',
  efficiency: 'from-yellow-500 to-orange-600'
}

export function AchievementBadge({ 
  achievement, 
  size = 'md', 
  showPoints = true,
  className 
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'h-16 w-16 text-xs',
    md: 'h-20 w-20 text-sm',
    lg: 'h-24 w-24 text-base'
  }

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <motion.div
      className={cn('relative', className)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300',
        achievement.isUnlocked 
          ? 'border-primary/50 shadow-lg bg-card hover:shadow-xl' 
          : 'border-muted bg-muted/30 opacity-60'
      )}>
        <CardContent className="p-0">
          <div className={cn(
            'flex flex-col items-center justify-center relative',
            sizeClasses[size]
          )}>
            {/* Background gradient for unlocked achievements */}
            {achievement.isUnlocked && (
              <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-10',
                categoryColors[achievement.category]
              )} />
            )}
            
            {/* Sparkle effect for unlocked achievements */}
            {achievement.isUnlocked && (
              <motion.div
                className="absolute top-1 right-1 text-yellow-400"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Sparkles className="h-3 w-3" />
              </motion.div>
            )}
            
            {/* Lock icon for locked achievements */}
            {!achievement.isUnlocked && (
              <div className="absolute top-1 right-1 text-muted-foreground">
                <Lock className="h-3 w-3" />
              </div>
            )}
            
            {/* Achievement icon/emoji */}
            <div className={cn(
              'relative z-10',
              iconSizes[size],
              achievement.isUnlocked ? 'grayscale-0' : 'grayscale'
            )}>
              {achievement.icon}
            </div>
            
            {/* Points badge */}
            {showPoints && achievement.isUnlocked && (
              <Badge 
                variant="secondary" 
                className="absolute -bottom-1 -right-1 h-5 px-1 text-xs font-bold bg-primary text-primary-foreground"
              >
                +{achievement.points}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Tooltip-like title */}
      <div className="text-center mt-2">
        <p className={cn(
          'text-xs font-medium truncate',
          achievement.isUnlocked ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {achievement.title}
        </p>
      </div>
    </motion.div>
  )
}

export default AchievementBadge