import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Brain, Zap, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIProgressBarProps {
  title: string
  description: string
  currentValue: number
  maxValue: number
  icon: 'brain' | 'zap' | 'target' | 'trending'
  color: 'blue' | 'green' | 'purple' | 'orange'
  showPercentage?: boolean
  showBadge?: boolean
  badgeText?: string
  className?: string
}

const icons = {
  brain: Brain,
  zap: Zap,
  target: Target,
  trending: TrendingUp
}

const colorSchemes = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-600',
    progress: 'bg-blue-500'
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-600',
    progress: 'bg-green-500'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-600',
    progress: 'bg-purple-500'
  },
  orange: {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-600',
    progress: 'bg-orange-500'
  }
}

export function AIProgressBar({
  title,
  description,
  currentValue,
  maxValue,
  icon,
  color,
  showPercentage = true,
  showBadge = false,
  badgeText,
  className
}: AIProgressBarProps) {
  const Icon = icons[icon]
  const colorScheme = colorSchemes[color]
  const percentage = Math.min((currentValue / maxValue) * 100, 100)
  
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        colorScheme.border
      )}>
        {/* Neural network pattern background */}
        <div className={cn(
          'absolute inset-0 opacity-5',
          colorScheme.bg
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-current to-transparent" />
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  'p-2 rounded-lg bg-gradient-to-br shadow-sm',
                  colorScheme.gradient
                )}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon className="h-4 w-4 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </div>
            </div>
            
            {showBadge && badgeText && (
              <Badge variant="outline" className={cn('text-xs', colorScheme.text)}>
                {badgeText}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Progress bar with neural network animation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                {currentValue.toLocaleString()} / {maxValue.toLocaleString()}
              </span>
              {showPercentage && (
                <span className={cn('text-sm font-bold', colorScheme.text)}>
                  {percentage.toFixed(0)}%
                </span>
              )}
            </div>
            
            <div className="relative">
              <Progress
                value={percentage}
                className="h-2 bg-muted"
              />
              
              {/* Neural pulse animation */}
              {percentage > 0 && (
                <motion.div
                  className={cn(
                    'absolute top-0 h-2 rounded-full opacity-60',
                    colorScheme.progress
                  )}
                  style={{ width: `${percentage}%` }}
                  animate={{
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
            </div>
          </div>
          
          {/* AI complexity indicators */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full bg-gradient-to-r', colorScheme.gradient)}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              AI Processing
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AIProgressBar