import { useEffect, useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { Task, TaskResult } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  DollarSign
} from 'lucide-react'
import { motion } from 'framer-motion'
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
  pending: 'text-yellow-600 bg-yellow-100',
  processing: 'text-blue-600 bg-blue-100',
  completed: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100'
}

const agentColors = {
  genspark: 'text-blue-600 bg-blue-100',
  abacus: 'text-green-600 bg-green-100', 
  minimax: 'text-purple-600 bg-purple-100',
  manus: 'text-orange-600 bg-orange-100'
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
      className="border rounded-lg overflow-hidden bg-white"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={statusColors[task.status]}>
                    <StatusIcon className={`h-3 w-3 mr-1 ${task.status === 'processing' ? 'animate-spin' : ''}`} />
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className={agentColors[task.selected_agent as keyof typeof agentColors]}>
                    <AgentIcon className="h-3 w-3 mr-1" />
                    {task.selected_agent.charAt(0).toUpperCase() + task.selected_agent.slice(1)}
                  </Badge>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'low' ? 'secondary' : 'default'}>
                    {task.priority} priority
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                  {task.task_content}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </div>
                  {task.estimated_cost > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${task.estimated_cost.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-slate-50">
            <div className="pt-4 space-y-4">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Task Details</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.task_content}</p>
              </div>
              
              {task.agent_reasoning && (
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Agent Selection Reasoning</h4>
                  <p className="text-sm text-slate-600">{task.agent_reasoning}</p>
                </div>
              )}
              
              {loadingResult && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading result...
                </div>
              )}
              
              {result && (
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Agent Response</h4>
                  {result.error_message ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {result.error_message}
                    </div>
                  ) : (
                    <div className="p-3 bg-white border rounded text-sm">
                      <div className="whitespace-pre-wrap">{result.agent_response}</div>
                      
                      {result.processing_time_ms && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-slate-500">
                          <span>Processing time: {(result.processing_time_ms / 1000).toFixed(1)}s</span>
                          {result.tokens_used && <span>Tokens: {result.tokens_used.toLocaleString()}</span>}
                          {result.actual_cost && <span>Cost: ${result.actual_cost.toFixed(4)}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  )
}

export function TaskHistory() {
  const { tasks, loading } = useTasks()

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Task History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-600" />
          Task History
        </CardTitle>
        <CardDescription>
          {tasks.length > 0 ? `${tasks.length} tasks total` : 'No tasks submitted yet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No tasks submitted yet.</p>
              <p className="text-sm">Submit your first task above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}