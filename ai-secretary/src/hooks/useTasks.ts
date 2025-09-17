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
      if (!user) {
        console.log('No user found for tasks query')
        return []
      }
      
      console.log('Fetching tasks for user:', user.id)
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching tasks:', error)
        throw error
      }
      
      console.log('Tasks fetched successfully:', data?.length || 0, 'tasks')
      return data as Task[]
    },
    enabled: !!user
  })

  // Create new task with enhanced debugging
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      taskContent: string
      priority?: string
      manualAgentOverride?: string
    }) => {
      if (!user) {
        console.error('Task creation failed: User not authenticated')
        throw new Error('User not authenticated')
      }

      console.log('Creating task:', {
        user_id: user.id,
        taskContent: taskData.taskContent.substring(0, 100) + '...',
        priority: taskData.priority,
        manualAgentOverride: taskData.manualAgentOverride
      })

      // Step 1: Get agent routing recommendation
      console.log('Step 1: Getting agent routing...')
      const { data: routingData, error: routingError } = await supabase.functions.invoke('task-router', {
        body: {
          taskContent: taskData.taskContent,
          manualAgentOverride: taskData.manualAgentOverride,
          userPreferences: { preferLowerCost: true }
        }
      })

      if (routingError) {
        console.error('Task routing failed:', routingError)
        throw new Error(`Task routing failed: ${routingError.message}`)
      }

      if (!routingData?.data) {
        console.error('No routing data received')
        throw new Error('No routing data received from task router')
      }

      const selectedAgent = routingData.data.selectedAgent
      const reasoning = routingData.data.reasoning

      console.log('Agent routing successful:', {
        selectedAgent,
        reasoning: reasoning?.substring(0, 100) + '...'
      })

      // Step 2: Create task record via secure edge function
      console.log('Step 2: Creating task record via submit-task edge function...')
      const taskRecord = {
        user_id: user.id,
        task_content: taskData.taskContent,
        selected_agent: selectedAgent,
        agent_reasoning: reasoning,
        status: 'pending' as const,
        priority: taskData.priority || 'normal',
        estimated_cost: 0
      }

      console.log('Submitting task via edge function:', {
        ...taskRecord,
        task_content: taskRecord.task_content.substring(0, 50) + '...',
        agent_reasoning: taskRecord.agent_reasoning?.substring(0, 50) + '...'
      })

      const { data: submitResult, error: taskError } = await supabase.functions.invoke('submit-task', {
        body: { task: taskRecord }
      })

      if (taskError) {
        console.error('Task submission failed:', {
          error: taskError,
          user_id: user.id,
          auth_state: !!user
        })
        throw new Error(`Failed to submit task: ${taskError.message}`)
      }

      if (!submitResult?.data) {
        console.error('No task returned after submission')
        throw new Error('Task was not created successfully')
      }

      const insertedTask = submitResult.data

      console.log('Task created successfully via edge function:', {
        task_id: insertedTask.id,
        status: insertedTask.status,
        selected_agent: insertedTask.selected_agent
      })

      // Note: Task processing is now automatically triggered by the submit-task edge function
      console.log('Task processing will be triggered automatically by submit-task function')

      return { task: insertedTask, routing: routingData.data }
    },
    onSuccess: (data) => {
      console.log('Task creation mutation successful:', data.task.id)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Task submitted successfully! (ID: ${data.task.id.slice(-8)})`)
    },
    onError: (error: any) => {
      console.error('Task creation mutation failed:', error)
      toast.error(error.message || 'Failed to submit task')
    }
  })

  // Get task result
  const getTaskResult = async (taskId: string): Promise<TaskResult | null> => {
    console.log('Fetching task result for:', taskId)
    
    const { data, error } = await supabase
      .from('task_results')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching task result:', error)
      throw error
    }
    
    console.log('Task result fetched:', data ? 'found' : 'not found')
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
      console.log('Fetching agent capabilities...')
      
      const { data, error } = await supabase
        .from('agent_capabilities')
        .select('*')
        .eq('is_active', true)
        .order('agent_name')
      
      if (error) {
        console.error('Error fetching agents:', error)
        throw error
      }
      
      console.log('Agents fetched successfully:', data?.length || 0, 'agents')
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
      console.log('Task routing request:', {
        taskContent: data.taskContent.substring(0, 50) + '...',
        manualAgentOverride: data.manualAgentOverride
      })
      
      const { data: routingData, error } = await supabase.functions.invoke('task-router', {
        body: data
      })
      
      if (error) {
        console.error('Task routing error:', error)
        throw error
      }
      
      console.log('Task routing successful:', routingData?.data?.selectedAgent)
      return routingData.data
    },
    onSuccess: (data) => {
      console.log('Task routing mutation successful')
      setRouting(data)
    },
    onError: (error: any) => {
      console.error('Task routing mutation failed:', error)
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
