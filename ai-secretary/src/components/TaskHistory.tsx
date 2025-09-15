import { useEffect, useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { Task, TaskResult } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AILoadingSpinner } from '@/components/ui/ai-loading-spinner'
import { NeuralBackground } from '@/components/ui/neural-background'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Brain, 
  Zap, 
  Lightbulb, 
  Building2,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  DollarSign,
  Sparkles,
  Activity,
  Timer,
  Cpu
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

const agentIcons = {
  genspark: Brain,
  abacus: Zap, 
  minimax: Lightbulb,
  manus: Building2
}

const statusIcons = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: AlertCircle
}

const statusColors = {
  pending: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
  processing: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  completed: 'text-green-600 bg-green-500/10 border-green-500/20',
  failed: 'text-red-600 bg-red-500/10 border-red-500/20'
}

const agentColors = {
  genspark: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  abacus: 'text-green-600 bg-green-500/10 border-green-500/20', 
  minimax: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
  manus: 'text-orange-600 bg-orange-500/10 border-orange-500/20'
}

const statusGlowColors = {
  pending: 'orange' as const,
  processing: 'blue' as const,
  completed: 'green' as const,
  failed: 'red' as const
}

function TaskCard({ task }: { task: Task }) {
  const [isOpen, setIsOpen] = useState(false)
  const [result, setResult] = useState<TaskResult | null>(null)
  const [loadingResult, setLoadingResult] = useState(false)
  const { getTaskResult } = useTasks()

  const StatusIcon = statusIcons[task.status]
  const AgentIcon = agentIcons[task.selected_agent as keyof typeof agentIcons] || Brain

  const loadResult = async () => {
    if (task.status === 'completed' || task.status === 'failed') {
      setLoadingResult(true)
      try {
        const taskResult = await getTaskResult(task.id)
        setResult(taskResult)
      } catch (error) {
        console.error('Failed to load result:', error)
      } finally {
        setLoadingResult(false)
      }
    }
  }

  useEffect(() => {
    if (isOpen && !result && (task.status === 'completed' || task.status === 'failed')) {
      loadResult()
    }
  }, [isOpen, task.status])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="relative overflow-hidden"
    >
      <AIGlowCard 
        glowColor={statusGlowColors[task.status]}
        intensity="low"
        className="overflow-hidden"
      >
        <NeuralBackground variant="subtle" color={statusGlowColors[task.status]} />
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <motion.div 
            className="p-4 hover:bg-muted/30 cursor-pointer transition-colors relative"
            whileHover={{ backgroundColor: 'rgba(var(--muted), 0.5)' }}
          >
            <div className="flex items-start justify-between gap-3 relative">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Badge className={`${statusColors[task.status]} border`}>
                      {task.status === 'processing' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                        </motion.div>
                      ) : (
                        <StatusIcon className="h-3 w-3 mr-1" />
                      )}
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </motion.div>
                  
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge variant="outline" className={`${agentColors[task.selected_agent as keyof typeof agentColors]} border`}>
                      <AgentIcon className="h-3 w-3 mr-1" />
                      {task.selected_agent.charAt(0).toUpperCase() + task.selected_agent.slice(1)}
                    </Badge>
                  </motion.div>
                  
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'low' ? 'secondary' : 'default'}
                      className="border"
                    >
                      {task.priority} priority
                    </Badge>
                  </motion.div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {task.task_content}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <motion.div 
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </motion.div>
                  {task.estimated_cost > 0 && (
                    <motion.div 
                      className="flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      <DollarSign className="h-3 w-3" />
                      ${task.estimated_cost.toFixed(4)}
                    </motion.div>
                  )}
                  <motion.div 
                    className="flex items-center gap-1 text-primary"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Processed
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="flex items-center gap-1"
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </div>
          </motion.div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <motion.div 
            className="px-4 pb-4 border-t bg-muted/20 backdrop-blur-sm relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pt-4 space-y-4 relative">
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  Task Details
                </h4>
                <div className="p-3 bg-card/50 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.task_content}</p>
                </div>
              </div>
              
              {task.agent_reasoning && (
                <div>
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    AI Neural Network Reasoning
                  </h4>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">{task.agent_reasoning}</p>
                  </div>
                </div>
              )}
              
              <AnimatePresence>
                {loadingResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <AILoadingSpinner size="sm" variant="neural" />
                    Loading AI response...
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      AI Agent Response
                    </h4>
                    {result.error_message ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <strong>Processing Error</strong>
                        </div>
                        {result.error_message}
                      </div>
                    ) : (
                      <div className="p-3 bg-card/50 border border-border/50 rounded-lg text-sm backdrop-blur-sm">
                        <div className="whitespace-pre-wrap">{result.agent_response}</div>
                        
                        {result.processing_time_ms && (
                          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              <span>{(result.processing_time_ms / 1000).toFixed(1)}s</span>
                            </div>
                            {result.tokens_used && (
                              <div className="flex items-center gap-1">
                                <Cpu className="h-3 w-3" />
                                <span>{result.tokens_used.toLocaleString()} tokens</span>
                              </div>
                            )}
                            {result.actual_cost && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>${result.actual_cost.toFixed(4)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
      </AIGlowCard>
    </motion.div>
  )
}

export function TaskHistory() {
  const { tasks, loading } = useTasks()

  if (loading) {
    return (
      <Card className="w-full relative overflow-hidden border-primary/20">
        <NeuralBackground variant="subtle" color="blue" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Activity className="h-5 w-5 text-primary" />
            </motion.div>
            AI Task History
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AILoadingSpinner size="md" variant="neural" text="Loading task history..." />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full relative overflow-hidden border-primary/20">
      <NeuralBackground variant="subtle" color="multi" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <motion.div
                className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Clock className="h-5 w-5 text-white" />
              </motion.div>
              AI Task History
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              {tasks.length > 0 ? `${tasks.length} AI-orchestrated tasks` : 'No tasks submitted yet'}
            </CardDescription>
          </div>
          
          {tasks.length > 0 && (
            <motion.div
              className="text-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-2xl font-bold text-primary">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">
                Completed
              </div>
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <ScrollArea className="h-[600px] pr-4">
          {tasks.length === 0 ? (
            <motion.div 
              className="text-center py-8 text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Brain className="h-12 w-12 mx-auto mb-3 text-muted/50" />
              </motion.div>
              <p className="font-medium">No AI tasks orchestrated yet.</p>
              <p className="text-sm">Submit your first task above to begin your AI journey!</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}