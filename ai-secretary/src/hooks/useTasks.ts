import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, Task, TaskResult, AgentCapability } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export function useTasks() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch user's tasks
  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Task[]
    },
    enabled: !!user
  })

  // Create new task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      taskContent: string
      priority?: string
      manualAgentOverride?: string
    }) => {
      if (!user) throw new Error('User not authenticated')

      // First, get agent routing recommendation
      const { data: routingData, error: routingError } = await supabase.functions.invoke('task-router', {
        body: {
          taskContent: taskData.taskContent,
          manualAgentOverride: taskData.manualAgentOverride,
          userPreferences: { preferLowerCost: true }
        }
      })

      if (routingError) throw routingError

      const selectedAgent = routingData.data.selectedAgent
      const reasoning = routingData.data.reasoning

      // Create task record
      const { data: taskRecord, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          task_content: taskData.taskContent,
          selected_agent: selectedAgent,
          agent_reasoning: reasoning,
          status: 'pending',
          priority: taskData.priority || 'normal',
          estimated_cost: 0
        })
        .select()
        .single()

      if (taskError) throw taskError

      // Trigger task processing (async)
      supabase.functions.invoke('task-processor', {
        body: {
          taskId: taskRecord.id,
          taskContent: taskData.taskContent,
          selectedAgent,
          priority: taskData.priority || 'normal'
        }
      })

      return { task: taskRecord, routing: routingData.data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task submitted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit task')
    }
  })

  // Get task result
  const getTaskResult = async (taskId: string): Promise<TaskResult | null> => {
    const { data, error } = await supabase
      .from('task_results')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  return {
    tasks: tasksQuery.data || [],
    loading: tasksQuery.isLoading,
    createTask: createTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    getTaskResult
  }
}

export function useAgents() {
  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_capabilities')
        .select('*')
        .eq('is_active', true)
        .order('agent_name')
      
      if (error) throw error
      return data as AgentCapability[]
    }
  })

  return {
    agents: agentsQuery.data || [],
    loading: agentsQuery.isLoading
  }
}

export function useTaskRouter() {
  const [routing, setRouting] = useState<any>(null)
  
  const routeTaskMutation = useMutation({
    mutationFn: async (data: {
      taskContent: string
      manualAgentOverride?: string
      userPreferences?: any
    }) => {
      const { data: routingData, error } = await supabase.functions.invoke('task-router', {
        body: data
      })
      
      if (error) throw error
      return routingData.data
    },
    onSuccess: (data) => {
      setRouting(data)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to route task')
    }
  })

  return {
    routing,
    routeTask: routeTaskMutation.mutate,
    isRouting: routeTaskMutation.isPending,
    clearRouting: () => setRouting(null)
  }
}
