import { useState } from 'react'
import { useTasks, useTaskRouter, useAgents } from '@/hooks/useTasks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Brain, Zap, Lightbulb, Building2 } from 'lucide-react'
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" />
          Submit New Task
        </CardTitle>
        <CardDescription>
          Describe your task and let our AI agents help you accomplish it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Task Description</label>
          <Textarea
            placeholder="Describe what you need help with in detail. The more specific you are, the better our AI agents can assist you..."
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isCreating}
          />
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
          <Button
            variant="outline"
            onClick={handlePreviewRouting}
            disabled={!taskContent.trim() || isRouting || isCreating}
            className="flex-1"
          >
            {isRouting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Brain className="mr-2 h-4 w-4" /> Preview Agent Selection</>
            )}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!taskContent.trim() || isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Submit Task</>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {routing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border rounded-lg p-4 bg-muted/50"
            >
              <h4 className="font-medium text-foreground mb-3">Agent Selection Preview</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${agentColors[routing.selectedAgent as keyof typeof agentColors]}`}>
                    <SelectedIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{routing.selectedAgent}</span>
                      <Badge variant="secondary">Confidence: {(routing.confidence * 100).toFixed(0)}%</Badge>
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
                    <span className="text-sm font-medium text-foreground">Alternative Agents:</span>
                    <div className="flex gap-2 mt-1">
                      {routing.alternatives.map((alt: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {alt.agent} ({alt.score})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}