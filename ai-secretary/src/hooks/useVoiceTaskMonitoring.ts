import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface TaskResult {
  id: string
  task_id: string
  result: string
  agent_name: string
  status: 'completed' | 'failed' | 'processing'
  created_at: string
  updated_at: string
}

interface VoiceResponse {
  id: string
  text: string
  timestamp: Date
  agentName?: string
  taskId?: string
}

export function useVoiceTaskMonitoring() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [voiceResponses, setVoiceResponses] = useState<VoiceResponse[]>([])
  const [monitoredTasks, setMonitoredTasks] = useState<Set<string>>(new Set())
  
  // Query to fetch task results for completed tasks
  const { data: taskResults } = useQuery({
    queryKey: ['voice-task-results', user?.id],
    queryFn: async () => {
      if (!user || monitoredTasks.size === 0) return []
      
      const taskIds = Array.from(monitoredTasks)
      const { data, error } = await supabase
        .from('task_results')
        .select('*')
        .in('task_id', taskIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Failed to fetch task results:', error)
        return []
      }
      
      return data as TaskResult[]
    },
    enabled: !!user && monitoredTasks.size > 0,
    refetchInterval: 2000, // Poll every 2 seconds for new results
  })
  
  // Monitor task completion and add to voice responses
  useEffect(() => {
    if (!taskResults) return
    
    taskResults.forEach(result => {
      // Check if we already processed this result
      const alreadyProcessed = voiceResponses.some(response => 
        response.taskId === result.task_id
      )
      
      if (!alreadyProcessed && result.result) {
        const newResponse: VoiceResponse = {
          id: `ai-response-${result.id}`,
          text: result.result,
          timestamp: new Date(result.updated_at),
          agentName: result.agent_name || 'AI Agent',
          taskId: result.task_id
        }
        
        setVoiceResponses(prev => [newResponse, ...prev])
        
        // Show success notification
        toast.success(`AI response received from ${result.agent_name || 'Agent'}!`)
        
        // Remove from monitored tasks since it's completed
        setMonitoredTasks(prev => {
          const newSet = new Set(prev)
          newSet.delete(result.task_id)
          return newSet
        })
      }
    })
  }, [taskResults, voiceResponses])
  
  // Function to start monitoring a new task
  const addTaskToMonitor = useCallback((taskId: string) => {
    setMonitoredTasks(prev => new Set([...prev, taskId]))
    
    // Add a "processing" response immediately
    const processingResponse: VoiceResponse = {
      id: `processing-${taskId}-${Date.now()}`,
      text: "Your voice command has been received and is being processed by our AI agents. Please wait for the response...",
      timestamp: new Date(),
      agentName: 'Neural Collective Router',
      taskId
    }
    
    setVoiceResponses(prev => [processingResponse, ...prev])
  }, [])
  
  // Function to clear all voice responses
  const clearVoiceResponses = useCallback(() => {
    setVoiceResponses([])
    setMonitoredTasks(new Set())
    toast.success('Voice response history cleared')
  }, [])
  
  // Real-time subscription to task_results changes
  useEffect(() => {
    if (!user || monitoredTasks.size === 0) return
    
    const taskIds = Array.from(monitoredTasks)
    
    const subscription = supabase
      .channel('voice-task-results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_results',
          filter: `task_id=in.(${taskIds.join(',')})`
        },
        (payload) => {
          console.log('Real-time task result update:', payload)
          // Refetch task results when there's a change
          queryClient.invalidateQueries({ queryKey: ['voice-task-results'] })
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [user, monitoredTasks, queryClient])
  
  return {
    voiceResponses,
    addTaskToMonitor,
    clearVoiceResponses,
    isMonitoring: monitoredTasks.size > 0
  }
}