import React from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AILoadingSpinner } from '@/components/ui/ai-loading-spinner';
import { NeuralBackground } from '@/components/ui/neural-background';
import { AIGlowCard } from '@/components/ui/ai-glow-card';
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
  Timer,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Task, TaskResult } from '@/lib/supabase';

const agentIcons = {
  genspark: Brain,
  abacus: Zap, 
  minimax: Lightbulb,
  manus: Building2
};

const statusIcons = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: AlertCircle
};

const statusColors = {
  pending: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
  processing: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  completed: 'text-green-600 bg-green-500/10 border-green-500/20',
  failed: 'text-red-600 bg-red-500/10 border-red-500/20'
};

const agentColors = {
  genspark: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  abacus: 'text-green-600 bg-green-500/10 border-green-500/20', 
  minimax: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
  manus: 'text-orange-600 bg-orange-500/10 border-orange-500/20'
};

const statusGlowColors = {
  pending: 'orange' as const,
  processing: 'blue' as const,
  completed: 'green' as const,
  failed: 'red' as const
};

function TaskCard({ task }: { task: Task }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [result, setResult] = React.useState<TaskResult | null>(null);
  const [loadingResult, setLoadingResult] = React.useState(false);
  const { getTaskResult } = useTasks();

  const StatusIcon = statusIcons[task.status];
  const AgentIcon = agentIcons[task.selected_agent as keyof typeof agentIcons] || Brain;

  const loadResult = async () => {
    if (task.status === 'completed' || task.status === 'failed') {
      setLoadingResult(true);
      try {
        const taskResult = await getTaskResult(task.id);
        setResult(taskResult);
      } catch (error) {
        console.error('Failed to load result:', error);
      } finally {
        setLoadingResult(false);
      }
    }
  };

  React.useEffect(() => {
    if (isOpen && !result && (task.status === 'completed' || task.status === 'failed')) {
      loadResult();
    }
  }, [isOpen, task.status]);

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
  );
}

const TaskHistory: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading, getTaskResult } = useTasks();
  
  // Add manual refetch capability
  const [isRefetching, setIsRefetching] = React.useState(false);
  const queryClient = useQueryClient();
  
  const refetch = async () => {
    setIsRefetching(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } finally {
      setIsRefetching(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <AILoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view your task history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.h1 
            className="text-4xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Task History
          </motion.h1>
          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-muted-foreground">Track and review your AI assistant interactions</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </motion.div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <AILoadingSpinner size="lg" />
              <p className="text-muted-foreground mt-4">Loading your tasks...</p>
            </div>
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No AI tasks performed yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your task history will appear here once you start using the AI assistant. 
              Create your first task to get started!
            </p>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {user.email}
              </div>
            </div>
            
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TaskHistory;