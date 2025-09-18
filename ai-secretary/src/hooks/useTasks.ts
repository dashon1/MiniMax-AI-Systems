import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, Task, TaskResult, AgentCapability } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export function useTasks() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [authDebugInfo, setAuthDebugInfo] = useState<any>(null)

  // Enhanced authentication debugging
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        console.log('🔍 Auth Debug: No user in context')
        setAuthDebugInfo({ status: 'no_user', timestamp: new Date().toISOString() })
        return
      }

      console.log('🔍 Auth Debug: User found in context:', user.id)
      
      // Check current session
      const { data: session, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('🔍 Auth Debug: Session error:', sessionError)
        setAuthDebugInfo({ 
          status: 'session_error', 
          error: sessionError.message,
          timestamp: new Date().toISOString() 
        })
        return
      }

      if (!session?.session) {
        console.log('🔍 Auth Debug: No active session')
        setAuthDebugInfo({ 
          status: 'no_session',
          timestamp: new Date().toISOString() 
        })
        return
      }

      console.log('🔍 Auth Debug: Active session found for user:', session.session.user.id)
      setAuthDebugInfo({ 
        status: 'authenticated',
        user_id: session.session.user.id,
        session_expires: session.session.expires_at,
        timestamp: new Date().toISOString()
      })
    }

    checkAuth()
  }, [user])

  // Fetch user's tasks with enhanced debugging
  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('📋 Tasks Query: No user found')
        return []
      }
      
      console.log('📋 Tasks Query: Starting for user:', user.id)
      
      // First, verify current session
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) {
        console.error('📋 Tasks Query: No active session during query')
        throw new Error('No active session. Please sign in again.')
      }

      console.log('📋 Tasks Query: Session verified, querying tasks...')
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('📋 Tasks Query: Database error:', error)
        
        // If it's an auth error, try to refresh the session
        if (error.message?.includes('JWT') || error.message?.includes('expired')) {
          console.log('📋 Tasks Query: Attempting session refresh...')
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error('📋 Tasks Query: Session refresh failed:', refreshError)
            throw new Error('Session expired. Please sign in again.')
          }
          
          console.log('📋 Tasks Query: Session refreshed, retrying query...')
          
          // Retry the query with refreshed session
          const { data: retryData, error: retryError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          if (retryError) {
            console.error('📋 Tasks Query: Retry failed:', retryError)
            throw retryError
          }
          
          console.log('📋 Tasks Query: Retry successful, found', retryData?.length || 0, 'tasks')
          return retryData as Task[]
        }
        
        throw error
      }
      
      console.log('📋 Tasks Query: Success! Found', data?.length || 0, 'tasks')
      
      // Log first few task IDs for debugging
      if (data && data.length > 0) {
        console.log('📋 Tasks Query: Sample tasks:', data.slice(0, 3).map(t => ({ 
          id: t.id.slice(-8), 
          status: t.status, 
          created: t.created_at 
        })))
      }
      
      return data as Task[]
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    retry: (failureCount, error) => {
      // Retry up to 2 times for non-auth errors
      if (failureCount < 2 && !error.message?.includes('sign in')) {
        return true
      }
      return false
    }
  })

  // Create new task with enhanced debugging
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      taskContent: string
      priority?: string
      manualAgentOverride?: string
    }) => {
      if (!user) {
        console.error('📝 Task Creation: User not authenticated')
        throw new Error('User not authenticated')
      }

      console.log('📝 Task Creation: Starting for user:', user.id)

      // Step 1: Get agent routing recommendation
      console.log('📝 Task Creation: Step 1 - Getting agent routing...')
      const { data: routingData, error: routingError } = await supabase.functions.invoke('task-router', {
        body: {
          taskContent: taskData.taskContent,
          manualAgentOverride: taskData.manualAgentOverride,
          userPreferences: { preferLowerCost: true }
        }
      })

      if (routingError) {
        console.error('📝 Task Creation: Routing failed:', routingError)
        throw new Error(`Task routing failed: ${routingError.message}`)
      }

      if (!routingData?.data) {
        console.error('📝 Task Creation: No routing data received')
        throw new Error('No routing data received from task router')
      }

      const selectedAgent = routingData.data.selectedAgent
      const reasoning = routingData.data.reasoning

      console.log('📝 Task Creation: Routing successful, agent:', selectedAgent)

      // Step 2: Create task record via secure edge function
      console.log('📝 Task Creation: Step 2 - Creating task record...')
      const taskRecord = {
        user_id: user.id,
        task_content: taskData.taskContent,
        selected_agent: selectedAgent,
        agent_reasoning: reasoning,
        status: 'pending' as const,
        priority: taskData.priority || 'normal',
        estimated_cost: 0
      }

      const { data: submitResult, error: taskError } = await supabase.functions.invoke('submit-task', {
        body: { task: taskRecord }
      })

      if (taskError) {
        console.error('📝 Task Creation: Submission failed:', taskError)
        
        // Provide user-friendly error messages based on error type
        let userMessage = 'Failed to submit task. Please try again.'
        
        if (taskError.message?.includes('Task data is required')) {
          userMessage = 'Invalid task data. Please refresh the page and try again.'
        } else if (taskError.message?.includes('Failed to insert task')) {
          userMessage = 'Database error. Please try again in a moment.'
        } else if (taskError.message?.includes('Authentication')) {
          userMessage = 'Please sign in again to submit tasks.'
        } else if (taskError.message?.includes('network') || taskError.message?.includes('fetch')) {
          userMessage = 'Network error. Please check your connection and try again.'
        }
        
        throw new Error(userMessage)
      }

      if (!submitResult?.data) {
        console.error('📝 Task Creation: No task returned after submission')
        throw new Error('Task was not created successfully')
      }

      const insertedTask = submitResult.data
      console.log('📝 Task Creation: Success! Task ID:', insertedTask.id)

      return { task: insertedTask, routing: routingData.data }
    },
    onSuccess: (data) => {
      console.log('📝 Task Creation: Mutation successful, invalidating queries')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Task submitted successfully! (ID: ${data.task.id.slice(-8)})`)
    },
    onError: (error: any) => {
      console.error('📝 Task Creation: Mutation failed:', error)
      toast.error(error.message || 'Failed to submit task')
    }
  })

  // Get task result with enhanced debugging
  const getTaskResult = async (taskId: string): Promise<TaskResult | null> => {
    console.log('📊 Task Result: Fetching for task:', taskId)
    
    const { data, error } = await supabase
      .from('task_results')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle()
    
    if (error) {
      console.error('📊 Task Result: Error:', error)
      throw error
    }
    
    console.log('📊 Task Result:', data ? 'Found' : 'Not found')
    return data
  }

  // Diagnostic function to check authentication and task access
  const diagnoseTaskHistory = async () => {
    console.log('🔧 Diagnostic: Starting task history diagnosis...')
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-task-history')
      
      if (error) {
        console.error('🔧 Diagnostic: Edge function error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('🔧 Diagnostic: Results:', data)
      return data
    } catch (error) {
      console.error('🔧 Diagnostic: Unexpected error:', error)
      return { success: false, error: 'Diagnostic failed' }
    }
  }

  return {
    tasks: tasksQuery.data || [],
    loading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    getTaskResult,
    diagnoseTaskHistory,
    authDebugInfo,
    refetch: tasksQuery.refetch
  }
}

export function useAgents() {
  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      console.log('🤖 Agents Query: Fetching agent capabilities...')
      
      const { data, error } = await supabase
        .from('agent_capabilities')
        .select('*')
        .eq('is_active', true)
        .order('agent_name')
      
      if (error) {
        console.error('🤖 Agents Query: Error:', error)
        throw error
      }
      
      console.log('🤖 Agents Query: Success! Found', data?.length || 0, 'agents')
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
      console.log('🎯 Task Router: Starting routing...')
      
      const { data: routingData, error } = await supabase.functions.invoke('task-router', {
        body: data
      })
      
      if (error) {
        console.error('🎯 Task Router: Error:', error)
        throw error
      }
      
      console.log('🎯 Task Router: Success! Selected agent:', routingData?.data?.selectedAgent)
      return routingData.data
    },
    onSuccess: (data) => {
      console.log('🎯 Task Router: Mutation successful')
      setRouting(data)
    },
    onError: (error: any) => {
      console.error('🎯 Task Router: Mutation failed:', error)
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
