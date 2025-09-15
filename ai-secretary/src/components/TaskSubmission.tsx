import { useState } from 'react'
import { useTasks, useTaskRouter, useAgents } from '@/hooks/useTasks'
import { useGamification } from '@/hooks/useGamification'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AILoadingSpinner } from '@/components/ui/ai-loading-spinner'
import { NeuralBackground } from '@/components/ui/neural-background'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { Loader2, Send, Brain, Zap, Lightbulb, Building2, Sparkles, Target, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const agentIcons = {
  genspark: Brain,
  abacus: Zap, 
  minimax: Lightbulb,
  manus: Building2
}

const agentColors = {
  genspark: 'bg-blue-500',
  abacus: 'bg-green-500', 
  minimax: 'bg-purple-500',
  manus: 'bg-orange-500'
}

export function TaskSubmission() {
  const [taskContent, setTaskContent] = useState('')
  const [priority, setPriority] = useState('normal')
  const [manualAgent, setManualAgent] = useState<string | undefined>()
  
  const { createTask, isCreating } = useTasks()
  const { routing, routeTask, isRouting, clearRouting } = useTaskRouter()
  const { agents } = useAgents()
  const { calculateTaskComplexity } = useGamification()
  
  const taskComplexity = taskContent ? calculateTaskComplexity(taskContent) : 0

  const handlePreviewRouting = () => {
    if (!taskContent.trim()) return
    routeTask({
      taskContent,
      manualAgentOverride: manualAgent,
      userPreferences: { preferLowerCost: true }
    })
  }

  const handleSubmit = () => {
    if (!taskContent.trim()) return
    
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
  }

  const selectedAgentData = routing ? agents.find(a => a.agent_name === routing.selectedAgent) : null
  const SelectedIcon = selectedAgentData ? agentIcons[selectedAgentData.agent_name as keyof typeof agentIcons] : Brain

  return (
    <Card className="w-full relative overflow-hidden border-primary/20">
      {/* Neural background */}
      <NeuralBackground variant="subtle" color="blue" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-xl">
          <motion.div
            className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Send className="h-5 w-5 text-white" />
          </motion.div>
          AI Task Orchestration
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </motion.div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Describe your task and let our neural network route it to the optimal AI agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        {/* Task Complexity Indicator */}
        {taskContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Complexity Analysis</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${taskComplexity > 70 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                           taskComplexity > 40 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
                           'bg-green-500/10 text-green-600 border-green-500/20'}`}
              >
                {taskComplexity > 70 ? 'High' : taskComplexity > 40 ? 'Medium' : 'Low'} Complexity ({taskComplexity}%)
              </Badge>
            </div>
          </motion.div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Task Description
          </label>
          <motion.div
            whileFocus={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Textarea
              placeholder="Describe what you need help with in detail. The more specific you are, the better our AI agents can orchestrate the solution..."
              value={taskContent}
              onChange={(e) => setTaskContent(e.target.value)}
              className="min-h-[120px] resize-none bg-card/50 backdrop-blur-sm border-primary/20 focus:border-primary/40 transition-colors"
              disabled={isCreating}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Priority</label>
            <Select value={priority} onValueChange={setPriority} disabled={isCreating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="normal">Normal Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Manual Agent Selection</label>
            <Select value={manualAgent} onValueChange={setManualAgent} disabled={isCreating}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-select (recommended)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined as any}>Auto-select (recommended)</SelectItem>
                {agents.map((agent) => {
                  const Icon = agentIcons[agent.agent_name as keyof typeof agentIcons]
                  return (
                    <SelectItem key={agent.id} value={agent.agent_name}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {agent.agent_name.charAt(0).toUpperCase() + agent.agent_name.slice(1)}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={handlePreviewRouting}
              disabled={!taskContent.trim() || isRouting || isCreating}
              className="w-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-primary/20 hover:border-primary/40 transition-colors"
            >
              {isRouting ? (
                <div className="flex items-center gap-2">
                  <AILoadingSpinner size="sm" variant="neural" />
                  Neural Analysis...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Preview AI Routing
                </div>
              )}
            </Button>
          </motion.div>
          
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={!taskContent.trim() || isCreating}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <AILoadingSpinner size="sm" variant="processing" />
                  Orchestrating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit to AI Network
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
                <NeuralBackground variant="subtle" color="green" />
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2 relative">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Brain className="h-4 w-4 text-primary" />
                </motion.div>
                AI Neural Network Analysis
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
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
                      <span className="font-medium capitalize">{routing.selectedAgent}</span>
                      <Badge 
                        variant="secondary" 
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Confidence: {(routing.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{selectedAgentData?.description}</p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-foreground">Selection Reasoning: </span>
                  <span className="text-muted-foreground">{routing.reasoning}</span>
                </div>
                
                {routing.alternatives && routing.alternatives.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Alternative AI Routes:
                    </span>
                    <div className="flex gap-2 mt-1">
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