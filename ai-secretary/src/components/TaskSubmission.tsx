import { useSubscription } from '@/contexts/SubscriptionContext'
import { useState } from 'react'
import { useTasks, useTaskRouter, useAgents } from '@/hooks/useTasks'
import { useGamification } from '@/hooks/useGamification'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AILoadingSpinner } from '@/components/ui/ai-loading-spinner'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { Loader2, Send, Brain, Zap, Lightbulb, Building2, Sparkles, Target, Cpu, Users, Shield, Activity, CreditCard, Code, Search, FileText, Rocket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const agentIcons = {
  genspark: Brain,
  abacus: Zap, 
  minimax: Lightbulb,
  manus: Building2,
  mvp_agent: Rocket,
  fullstack_dev: Code,
  deep_research: Search,
  report_writer: FileText
}

const agentColors = {
  genspark: 'bg-blue-500',
  abacus: 'bg-green-500', 
  minimax: 'bg-purple-500',
  manus: 'bg-orange-500',
  mvp_agent: 'bg-cyan-500',
  fullstack_dev: 'bg-indigo-500',
  deep_research: 'bg-teal-500',
  report_writer: 'bg-pink-500'
}

export function TaskSubmission() {
  const [taskContent, setTaskContent] = useState('')
  const [priority, setPriority] = useState('normal')
  const [manualAgent, setManualAgent] = useState<string | undefined>()
  
  const { createTask, isCreating } = useTasks()
  const { routing, routeTask, isRouting, clearRouting } = useTaskRouter()
  const { agents } = useAgents()
  const { calculateTaskComplexity } = useGamification()
  const { useCredits, getRemainingCredits, isNearCreditLimit } = useSubscription()
  
  const taskComplexity = taskContent ? calculateTaskComplexity(taskContent) : 0
  
  // Calculate estimated credit cost based on task complexity
  const estimatedCreditCost = Math.max(1, Math.ceil(taskComplexity / 10))
  const remainingCredits = getRemainingCredits()
  const canAffordTask = remainingCredits >= estimatedCreditCost

  const handlePreviewRouting = () => {
    if (!taskContent.trim()) return
    routeTask({
      taskContent,
      manualAgentOverride: manualAgent,
      userPreferences: { preferLowerCost: true }
    })
  }

  const handleSubmit = async () => {
    if (!taskContent.trim() || !canAffordTask) {
      if (!taskContent.trim()) {
        toast.error('Please enter a task description')
      } else if (!canAffordTask) {
        toast.error(`Insufficient credits. You need ${estimatedCreditCost} credits but only have ${remainingCredits} remaining.`)
      }
      return
    }
    
    try {
      // Use credits before submitting task
      console.log(`Attempting to use ${estimatedCreditCost} credits for task submission`)
      const success = await useCredits(estimatedCreditCost)
      
      if (!success) {
        toast.error('Failed to process credit usage. Please try again or contact support.')
        return
      }
      
      console.log('Credits used successfully, submitting task')
      
      // Submit task
      createTask({
        taskContent,
        priority,
        manualAgentOverride: manualAgent
      })
      
      // Clear form
      setTaskContent('')
      setPriority('normal')
      setManualAgent(undefined)
      clearRouting()
      
    } catch (error) {
      console.error('Task submission error:', error)
      toast.error('Failed to submit task. Please try again.')
    }
  }

  const selectedAgentData = routing ? agents.find(a => a.agent_name === routing.selectedAgent) : null
  const SelectedIcon = selectedAgentData ? agentIcons[selectedAgentData.agent_name as keyof typeof agentIcons] : Brain

  return (
    <Card className="w-full relative overflow-hidden border-command-accent/30 bg-card/90 backdrop-blur-md">
      {/* Command Center background */}
      <CommandCenterBackground variant="subtle" color="command" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl">
          <motion.div
            className="p-3 bg-gradient-to-br from-command-accent to-command-success rounded-xl shadow-2xl relative overflow-hidden"
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
            <Send className="h-6 w-6 text-white relative z-10" />
          </motion.div>
          <div className="flex-1">
            <span className="command-title">Super Agent Group Orchestration</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-command-success/10 text-command-success border-command-success/20 text-xs">
                <Users className="h-3 w-3 mr-1" />
                Unified Collective
              </Badge>
              <Badge variant="outline" className="bg-command-accent/10 text-command-accent border-command-accent/20 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Neural Processing
              </Badge>
            </div>
          </div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-5 w-5 text-command-accent" />
          </motion.div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-command-accent" />
          Deploy tasks to our strongest agent workforce with intelligent collective routing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Task Complexity Analysis */}
        {taskContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-command-accent/10 to-command-success/10 rounded-lg border border-command-accent/20 holographic-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-command-accent" />
                <span className="text-sm font-medium">Neural Complexity Analysis</span>
                <Badge variant="outline" className="bg-command-accent/10 text-command-accent border-command-accent/20 text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Real-time
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${taskComplexity > 70 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                             taskComplexity > 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                             'bg-green-500/10 text-green-400 border-green-500/20'} font-bold`}
                >
                  {taskComplexity > 70 ? 'HIGH' : taskComplexity > 40 ? 'MEDIUM' : 'LOW'} COMPLEXITY ({taskComplexity}%)
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${!canAffordTask ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                             'bg-command-accent/10 text-command-accent border-command-accent/20'} font-bold`}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  {estimatedCreditCost} Credits
                </Badge>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Agent Group Recommendation:</span>
                <span className="text-command-accent font-medium">
                  {taskComplexity > 70 ? 'Full Collective Deployment' : 
                   taskComplexity > 40 ? 'Multi-Agent Coordination' : 'Specialized Agent Assignment'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Remaining Credits:</span>
                <span className={`font-medium ${remainingCredits < 10 ? 'text-red-400' : 'text-command-success'}`}>
                  {remainingCredits}
                </span>
              </div>
            </div>
            {!canAffordTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400"
              >
                Insufficient credits for this task. Please upgrade your plan or wait for credit refresh.
              </motion.div>
            )}
          </motion.div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-command-accent" />
            Mission Briefing
          </label>
          <motion.div
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Textarea
              placeholder="Describe your mission in detail. The more specific you are, the better our Super Agent Group can orchestrate the perfect solution. Our unified collective excels at complex, multi-faceted challenges..."
              value={taskContent}
              onChange={(e) => setTaskContent(e.target.value)}
              className="min-h-[120px] resize-none bg-card/50 backdrop-blur-sm border-command-accent/20 focus:border-command-accent/40 transition-colors holographic-border"
              disabled={isCreating}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-command-warning" />
              Priority Level
            </label>
            <Select value={priority} onValueChange={setPriority} disabled={isCreating}>
              <SelectTrigger className="holographic-border bg-card/50 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Standard Priority</SelectItem>
                <SelectItem value="normal">🟡 High Priority</SelectItem>
                <SelectItem value="high">🔴 Critical Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-command-success" />
              Agent Selection Override
            </label>
            <Select value={manualAgent} onValueChange={setManualAgent} disabled={isCreating}>
              <SelectTrigger className="holographic-border bg-card/50 backdrop-blur-sm">
                <SelectValue placeholder="🤖 Auto-Collective (Recommended)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as any}>🤖 Auto-Collective (Recommended)</SelectItem>
                {agents.map((agent) => {
                  const Icon = agentIcons[agent.agent_name as keyof typeof agentIcons]
                  return (
                    <SelectItem key={agent.id} value={agent.agent_name}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {agent.agent_name.charAt(0).toUpperCase() + agent.agent_name.slice(1)} Agent
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              variant="outline"
              onClick={handlePreviewRouting}
              disabled={!taskContent.trim() || isRouting || isCreating}
              className="w-full bg-gradient-to-r from-command-accent/5 to-command-success/5 border-command-accent/30 hover:border-command-accent/50 transition-colors holographic-border"
            >
              {isRouting ? (
                <div className="flex items-center gap-2">
                  <AILoadingSpinner size="sm" variant="neural" />
                  <span>Neural Analysis...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>Preview Collective Routing</span>
                </div>
              )}
            </Button>
          </motion.div>
          
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={handleSubmit}
              disabled={!taskContent.trim() || isCreating || !canAffordTask}
              className={`w-full font-semibold shadow-lg border-0 ${
                !canAffordTask 
                  ? 'bg-red-500/20 text-red-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-command-accent to-command-success hover:from-command-accent/80 hover:to-command-success/80 text-white'
              }`}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <AILoadingSpinner size="sm" variant="processing" />
                  <span>Deploying to Collective...</span>
                </div>
              ) : !canAffordTask ? (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3" />
                  <span>Insufficient Credits ({estimatedCreditCost} needed)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  <span>Deploy to Neural Collective ({estimatedCreditCost} credits)</span>
                </div>
              )}
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {routing && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <AIGlowCard glowColor="green" intensity="medium" className="p-4">
                <CommandCenterBackground variant="subtle" color="green" />
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2 relative">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Brain className="h-4 w-4 text-command-success" />
                  </motion.div>
                  <span>Super Agent Group Neural Analysis</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Routing Complete
                  </Badge>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${agentColors[routing.selectedAgent as keyof typeof agentColors]}`}>
                      <SelectedIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{routing.selectedAgent} Agent Selected</span>
                        <Badge 
                          variant="secondary" 
                          className="bg-command-accent/10 text-command-accent border-command-accent/20"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Confidence: {(routing.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{selectedAgentData?.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm bg-card/30 rounded p-3 border border-command-success/20">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Collective Intelligence Reasoning:
                    </span>
                    <p className="text-muted-foreground mt-1">{routing.reasoning}</p>
                  </div>
                  
                  {routing.alternatives && routing.alternatives.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Alternative Agent Routes:
                      </span>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {routing.alternatives.map((alt: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Badge variant="outline" className="text-xs bg-muted/50">
                              {alt.agent} ({alt.score})
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AIGlowCard>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}