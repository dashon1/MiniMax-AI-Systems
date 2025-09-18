import { useEffect, useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { Task, TaskResult, supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AILoadingSpinner } from '@/components/ui/ai-loading-spinner'
import { NeuralBackground } from '@/components/ui/neural-background'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { useAuth } from '@/contexts/AuthContext'
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
  Cpu,
  RefreshCw,
  AlertTriangle,
  Shield,
  Database,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

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
                      <Badge className={`${agentColors[task.selected_agent as keyof typeof agentColors] || agentColors.minimax} border`}>
                        <AgentIcon className="h-3 w-3 mr-1" />
                        {task.selected_agent}
                      </Badge>
                    </motion.div>
                  </div>
                  
                  <motion.p 
                    className="text-sm font-medium text-muted-foreground leading-relaxed mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {task.task_content.length > 100 
                      ? `${task.task_content.substring(0, 100)}...` 
                      : task.task_content}
                  </motion.p>
                  
                  <motion.div 
                    className="flex items-center gap-4 text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      ID: {task.id.slice(-8)}
                    </div>
                  </motion.div>
                </div>
                
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {task.estimated_cost > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${task.estimated_cost}
                    </Badge>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300">
            <motion.div 
              className="border-t border-border/50 p-4 bg-muted/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {task.agent_reasoning && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Agent Selection Reasoning
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 p-3 rounded border">
                    {task.agent_reasoning}
                  </p>
                </div>
              )}
              
              {(task.status === 'completed' || task.status === 'failed') && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Task Result
                  </h4>
                  {loadingResult ? (
                    <div className="flex items-center justify-center p-8">
                      <AILoadingSpinner size="md" />
                    </div>
                  ) : result ? (
                    <div className="bg-background/50 p-3 rounded border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Completed {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                      </p>
                      <ScrollArea className="max-h-48">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {result.agent_response}
                        </p>
                      </ScrollArea>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No detailed result available
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium">Created:</span>
                  <br />
                  {new Date(task.created_at).toLocaleString()}
                </div>
                {task.updated_at && (
                  <div>
                    <span className="font-medium">Updated:</span>
                    <br />
                    {new Date(task.updated_at).toLocaleString()}
                  </div>
                )}
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </AIGlowCard>
    </motion.div>
  )
}

function DebugInfo({ user, tasks, loading, error }: { user: any, tasks: any[], loading: boolean, error: any }) {
  const [showDebug, setShowDebug] = useState(false)
  
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          Frontend Debug Info
          <Button 
            onClick={() => setShowDebug(!showDebug)} 
            variant="outline" 
            size="sm"
            className="ml-auto"
          >
            {showDebug ? 'Hide' : 'Show'}
          </Button>
        </CardTitle>
      </CardHeader>
      {showDebug && (
        <CardContent className="space-y-2 text-xs">
          <div>
            <strong>User State:</strong>
            <pre className="bg-background/50 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify({
                exists: !!user,
                id: user?.id?.slice(-8) || 'none',
                email: user?.email || 'none'
              }, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Query State:</strong>
            <pre className="bg-background/50 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify({
                loading,
                error: error?.message || 'none',
                taskCount: tasks?.length || 0
              }, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Tasks Data:</strong>
            <pre className="bg-background/50 p-2 rounded mt-1 overflow-x-auto max-h-32">
              {JSON.stringify(tasks?.slice(0, 2).map(t => ({
                id: t?.id?.slice(-8),
                status: t?.status,
                user_id: t?.user_id?.slice(-8),
                created: t?.created_at
              })), null, 2)}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function DiagnosticPanel() {
  const { user } = useAuth()
  const { diagnoseTaskHistory, authDebugInfo } = useTasks()
  const [diagnostic, setDiagnostic] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [manualQueryResult, setManualQueryResult] = useState<any>(null)

  const runManualQuery = async () => {
    if (!user?.id) {
      toast.error('No user found for manual query')
      return
    }

    try {
      console.log('🔧 Manual Query: Testing direct database access for user:', user.id)
      
      // Test 1: Direct task query
      const { data: directTasks, error: directError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Test 2: Count query
      const { count: taskCount, error: countError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      // Test 3: General task query (no user filter)
      const { data: allTasks, error: allError } = await supabase
        .from('tasks')
        .select('id, user_id, status, created_at')
        .limit(5)
      
      const result = {
        timestamp: new Date().toISOString(),
        userId: user.id,
        directQuery: {
          success: !directError,
          error: directError?.message || null,
          count: directTasks?.length || 0,
          sampleTasks: directTasks?.slice(0, 2).map(t => ({
            id: t.id.slice(-8),
            user_id: t.user_id.slice(-8),
            status: t.status,
            created: t.created_at
          })) || []
        },
        countQuery: {
          success: !countError,
          error: countError?.message || null,
          count: taskCount || 0
        },
        allTasksQuery: {
          success: !allError,
          error: allError?.message || null,
          count: allTasks?.length || 0,
          sampleTasks: allTasks?.slice(0, 2).map(t => ({
            id: t.id.slice(-8),
            user_id: t.user_id.slice(-8),
            status: t.status,
            created: t.created_at
          })) || []
        }
      }
      
      console.log('🔧 Manual Query Results:', result)
      setManualQueryResult(result)
      
      if (directError) {
        toast.error(`Direct query failed: ${directError.message}`)
      } else {
        toast.success(`Manual query found ${directTasks?.length || 0} tasks`)
      }
      
    } catch (error: any) {
      console.error('🔧 Manual Query: Failed:', error)
      toast.error(`Manual query error: ${error.message}`)
    }
  }

  const runDiagnostic = async () => {
    setIsRunning(true)
    try {
      const result = await diagnoseTaskHistory()
      setDiagnostic(result)
      
      if (result.success) {
        toast.success('Diagnostic completed successfully')
      } else {
        toast.error('Diagnostic found issues')
      }
    } catch (error) {
      console.error('Diagnostic failed:', error)
      toast.error('Diagnostic failed to run')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-600" />
          Task History Diagnostic
        </CardTitle>
        <CardDescription className="text-xs">
          Debug authentication and data access issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning || !user}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Database className="h-3 w-3 mr-1" />
                Run Diagnostic
              </>
            )}
          </Button>
          
          <Button 
            onClick={runManualQuery} 
            disabled={!user}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            Manual Query
          </Button>
        </div>

        {authDebugInfo && (
          <div className="text-xs space-y-1">
            <div className="font-medium">Local Auth Status:</div>
            <div className="pl-2 text-muted-foreground">
              Status: {authDebugInfo.status}<br />
              {authDebugInfo.user_id && `User ID: ${authDebugInfo.user_id.slice(-8)}`}<br />
              Last Check: {new Date(authDebugInfo.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {diagnostic && (
          <div className="text-xs space-y-2 border-t pt-2">
            <div className="font-medium">Diagnostic Results:</div>
            {diagnostic.success ? (
              <div className="space-y-1">
                <div className="text-green-600">✓ Authentication working</div>
                <div className="text-green-600">✓ User ID: {diagnostic.data?.user_id?.slice(-8)}</div>
                <div className="text-green-600">✓ Total tasks: {diagnostic.data?.admin_query_results?.total_tasks || 0}</div>
                <div className={diagnostic.data?.rls_working ? 'text-green-600' : 'text-red-600'}>
                  {diagnostic.data?.rls_working ? '✓' : '✗'} RLS policies working
                </div>
                {diagnostic.data?.session_refresh && (
                  <div className="text-blue-600">
                    → Session refresh: {diagnostic.data.session_refresh.success ? 'Success' : 'Failed'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                ✗ Error: {diagnostic.error}
              </div>
            )}
          </div>
        )}
        
        {manualQueryResult && (
          <div className="text-xs space-y-2 border-t pt-2">
            <div className="font-medium">Manual Query Results:</div>
            <div className="space-y-2">
              <div>
                <strong>Direct User Query:</strong>
                <div className={manualQueryResult.directQuery.success ? 'text-green-600' : 'text-red-600'}>
                  {manualQueryResult.directQuery.success ? '✓' : '✗'} 
                  Found {manualQueryResult.directQuery.count} tasks
                  {manualQueryResult.directQuery.error && ` (Error: ${manualQueryResult.directQuery.error})`}
                </div>
              </div>
              
              <div>
                <strong>Count Query:</strong>
                <div className={manualQueryResult.countQuery.success ? 'text-green-600' : 'text-red-600'}>
                  {manualQueryResult.countQuery.success ? '✓' : '✗'} 
                  Count: {manualQueryResult.countQuery.count}
                  {manualQueryResult.countQuery.error && ` (Error: ${manualQueryResult.countQuery.error})`}
                </div>
              </div>
              
              <div>
                <strong>All Tasks Query:</strong>
                <div className={manualQueryResult.allTasksQuery.success ? 'text-green-600' : 'text-red-600'}>
                  {manualQueryResult.allTasksQuery.success ? '✓' : '✗'} 
                  Found {manualQueryResult.allTasksQuery.count} total tasks
                  {manualQueryResult.allTasksQuery.error && ` (Error: ${manualQueryResult.allTasksQuery.error})`}
                </div>
              </div>
              
              {manualQueryResult.directQuery.sampleTasks?.length > 0 && (
                <div>
                  <strong>Sample Tasks:</strong>
                  <pre className="bg-background/50 p-2 rounded mt-1 overflow-x-auto text-xs">
                    {JSON.stringify(manualQueryResult.directQuery.sampleTasks, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TaskHistory() {
  const { tasks, loading, error, refetch } = useTasks()
  const { user } = useAuth()
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  // Show diagnostic panel if no tasks are found and user is authenticated
  useEffect(() => {
    if (user && !loading && tasks.length === 0 && !error) {
      setShowDiagnostic(true)
    }
  }, [user, loading, tasks.length, error])

  if (loading) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center p-12 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AILoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading your task history...</p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center p-12 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Failed to load task history</p>
          <p className="text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </motion.div>
    )
  }

  if (!user) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center p-12 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <User className="h-12 w-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Please sign in</p>
          <p className="text-sm text-muted-foreground">
            Sign in to view your task history
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task History</h2>
          <p className="text-muted-foreground">
            {tasks.length > 0 
              ? `${tasks.length} task${tasks.length === 1 ? '' : 's'} found`
              : 'Your AI task executions will appear here'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            onClick={() => setShowDiagnostic(!showDiagnostic)} 
            variant="outline" 
            size="sm"
          >
            <Info className="h-4 w-4 mr-2" />
            Debug
          </Button>
        </div>
      </motion.div>

      <DebugInfo user={user} tasks={tasks} loading={loading} error={error} />

      {showDiagnostic && <DiagnosticPanel />}

      <AnimatePresence mode="wait">
        {tasks.length === 0 ? (
          <motion.div
            key="empty"
            className="flex flex-col items-center justify-center p-16 space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <AIGlowCard glowColor="blue" intensity="low" className="p-8">
              <NeuralBackground variant="subtle" color="blue" />
              <div className="flex flex-col items-center space-y-4 relative">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Activity className="h-16 w-16 text-blue-500 opacity-50" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No AI tasks performed yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Start by creating your first task using voice commands or the task submission form. 
                    Your completed tasks will appear here with detailed results and execution history.
                  </p>
                </div>
              </div>
            </AIGlowCard>
          </motion.div>
        ) : (
          <motion.div
            key="tasks"
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
