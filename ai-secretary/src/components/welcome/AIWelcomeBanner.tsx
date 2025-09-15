import { useAIWelcome } from '@/hooks/useAIWelcome'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { 
  Bot, 
  Sparkles, 
  X, 
  Users, 
  Brain, 
  Zap, 
  Target, 
  Shield,
  Activity,
  TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface AIWelcomeBannerProps {
  className?: string
}

export function AIWelcomeBanner({ className }: AIWelcomeBannerProps) {
  const [showWelcome, setShowWelcome] = useState(true)
  const { currentGreeting } = useAIWelcome()
  
  const dismissWelcome = () => {
    setShowWelcome(false)
  }
  
  const getWelcomeMessage = () => {
    return "Experience the most powerful unified AI agent collective in the industry. Our Super Agent Group combines specialized intelligence with seamless orchestration to deliver unprecedented results across all domains."
  }
  
  const welcomeMessage = getWelcomeMessage()

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn("relative", className)}
        >
          <Card className="relative overflow-hidden border-command-accent/30 bg-gradient-to-r from-card/90 to-card/80 backdrop-blur-md">
            <CommandCenterBackground variant="prominent" color="command" />
            
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Super Agent Group Avatar */}
                  <motion.div
                    className="relative"
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <div className="p-4 bg-gradient-to-br from-command-accent to-command-success rounded-2xl shadow-2xl relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-2xl"
                        animate={{
                          opacity: [0, 0.3, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                      <Bot className="h-8 w-8 text-white relative z-10" />
                    </div>
                    
                    {/* Power indicators */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                    />
                  </motion.div>
                  
                  {/* Welcome Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold command-title">
                        Welcome to the Command Center
                      </h3>
                      <Badge variant="outline" className="bg-command-success/10 text-command-success border-command-success/20">
                        <Users className="h-3 w-3 mr-1" />
                        Super Agent Group Online
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {welcomeMessage}
                    </p>
                    
                    {/* Feature highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2 p-3 bg-command-accent/10 rounded-lg border border-command-accent/20"
                      >
                        <Brain className="h-4 w-4 text-command-accent" />
                        <div>
                          <div className="text-sm font-medium text-command-accent">Neural Orchestration</div>
                          <div className="text-xs text-muted-foreground">Intelligent task routing</div>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2 p-3 bg-command-success/10 rounded-lg border border-command-success/20"
                      >
                        <Shield className="h-4 w-4 text-command-success" />
                        <div>
                          <div className="text-sm font-medium text-command-success">Unified Collective</div>
                          <div className="text-xs text-muted-foreground">Strongest agent workforce</div>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-2 p-3 bg-command-warning/10 rounded-lg border border-command-warning/20"
                      >
                        <TrendingUp className="h-4 w-4 text-command-warning" />
                        <div>
                          <div className="text-sm font-medium text-command-warning">Peak Performance</div>
                          <div className="text-xs text-muted-foreground">Industry-leading results</div>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Quick stats */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-4 flex items-center gap-6 text-sm text-muted-foreground"
                    >
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-green-400" />
                        <span><strong className="text-green-400">5</strong> Agent Collectives Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-command-accent" />
                        <span><strong className="text-command-accent">98%</strong> Success Rate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-command-warning" />
                        <span><strong className="text-command-warning">&lt;2s</strong> Response Time</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Dismiss button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissWelcome}
                  className="hover:bg-command-accent/10 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 8 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-command-accent/40 rounded-full"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}