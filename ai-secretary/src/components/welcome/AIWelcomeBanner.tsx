import { useAIWelcome } from '@/hooks/useAIWelcome'
import { useGamification } from '@/hooks/useGamification'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Zap,
  RefreshCw,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIWelcomeBannerProps {
  className?: string
}

const activityPatternConfig = {
  power_user: {
    icon: Brain,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    label: 'AI Power User'
  },
  active_user: {
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
    label: 'Active User'
  },
  regular_user: {
    icon: Target,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    label: 'Regular User'
  },
  new_user: {
    icon: Sparkles,
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-600',
    label: 'New User'
  },
  visitor: {
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-600',
    label: 'Visitor'
  }
}

export function AIWelcomeBanner({ className }: AIWelcomeBannerProps) {
  const { 
    currentGreeting, 
    activityPattern, 
    motivationalMessage,
    taskStats,
    refreshGreeting 
  } = useAIWelcome()
  const { stats } = useGamification()
  
  const patternConfig = activityPatternConfig[activityPattern]
  const PatternIcon = patternConfig.icon
  
  if (!currentGreeting) return null

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/50">
        {/* Neural network background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.15)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.15)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(59,130,246,0.1)_50%,transparent_70%)]" />
        </div>
        
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between gap-6">
            {/* Main greeting section */}
            <div className="flex-1 space-y-4">
              {/* AI greeting */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className={cn(
                      'p-2 rounded-lg bg-gradient-to-br shadow-sm',
                      patternConfig.color
                    )}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <PatternIcon className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {currentGreeting.message}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {motivationalMessage}
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {/* Highlight section */}
              {currentGreeting.highlight && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className={cn(
                    'inline-flex items-center gap-2 px-3 py-2 rounded-lg border',
                    currentGreeting.highlight.type === 'achievement' && 'bg-green-500/10 border-green-500/20 text-green-600',
                    currentGreeting.highlight.type === 'progress' && 'bg-blue-500/10 border-blue-500/20 text-blue-600',
                    currentGreeting.highlight.type === 'suggestion' && 'bg-purple-500/10 border-purple-500/20 text-purple-600'
                  )}>
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {currentGreeting.highlight.text}
                    </span>
                  </div>
                </motion.div>
              )}
              
              {/* Quick stats */}
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Badge variant="outline" className="text-xs">
                  Level {stats.currentLevel.level} • {stats.currentLevel.title}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {taskStats.thisWeek} tasks this week
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.achievements.filter(a => a.isUnlocked).length} achievements
                </Badge>
              </motion.div>
            </div>
            
            {/* Suggestion section */}
            {currentGreeting.suggestion && (
              <motion.div
                className="flex-shrink-0 w-64"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      AI Suggestion
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {currentGreeting.suggestion.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {currentGreeting.suggestion.description}
                    </p>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full h-8 text-xs"
                  >
                    {currentGreeting.suggestion.action}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Refresh button */}
          <motion.div
            className="absolute top-4 right-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshGreeting}
              className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AIWelcomeBanner