import { useState, useEffect } from 'react'
import { useGamification } from '@/hooks/useGamification'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Sparkles, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AchievementNotificationProps {
  className?: string
}

export function AchievementNotification({ className }: AchievementNotificationProps) {
  const { newAchievements, clearNewAchievements } = useGamification()
  const [isVisible, setIsVisible] = useState(false)
  const [currentAchievement, setCurrentAchievement] = useState(0)

  useEffect(() => {
    if (newAchievements.length > 0) {
      setIsVisible(true)
      setCurrentAchievement(0)
    }
  }, [newAchievements])

  const handleNext = () => {
    if (currentAchievement < newAchievements.length - 1) {
      setCurrentAchievement(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      clearNewAchievements()
      setCurrentAchievement(0)
    }, 300)
  }

  if (!newAchievements.length || !isVisible) return null

  const achievement = newAchievements[currentAchievement]
  const isLastAchievement = currentAchievement === newAchievements.length - 1

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />
        
        {/* Achievement card */}
        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="relative overflow-hidden border-primary bg-gradient-to-br from-card to-card/80 shadow-2xl">
            {/* Celebration background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10" />
            
            {/* Floating sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-400"
                  style={{
                    left: `${20 + (i * 15)}%`,
                    top: `${10 + (i % 3) * 20}%`
                  }}
                  animate={{
                    y: [-10, -20, -10],
                    opacity: [0.5, 1, 0.5],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2 + (i * 0.3),
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                </motion.div>
              ))}
            </div>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-20 h-8 w-8 p-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <CardContent className="relative p-8 text-center space-y-6">
              {/* Trophy icon */}
              <motion.div
                className="flex justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              
              {/* Achievement unlocked text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-primary mb-2">
                  Achievement Unlocked!
                </h2>
                <div className="text-4xl mb-4">{achievement.icon}</div>
              </motion.div>
              
              {/* Achievement details */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-bold text-foreground">
                  {achievement.title}
                </h3>
                <p className="text-muted-foreground">
                  {achievement.description}
                </p>
              </motion.div>
              
              {/* Points earned */}
              <motion.div
                className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold text-primary">
                  +{achievement.points} Intelligence Points
                </span>
              </motion.div>
              
              {/* Progress indicator */}
              {newAchievements.length > 1 && (
                <div className="flex justify-center gap-2">
                  {newAchievements.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-2 w-2 rounded-full transition-colors',
                        index === currentAchievement
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
              )}
              
              {/* Action button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isLastAchievement ? 'Continue' : `Next (${currentAchievement + 1}/${newAchievements.length})`}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AchievementNotification