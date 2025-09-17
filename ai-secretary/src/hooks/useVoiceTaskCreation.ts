import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export function useVoiceTaskCreation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const createVoiceTaskMutation = useMutation({
    mutationFn: async (taskData: {
      taskContent: string
      priority?: string
      manualAgentOverride?: string
    }) => {
      if (!user) {
        console.error('Voice task creation failed: User not authenticated')
        throw new Error('User not authenticated')
      }

      console.log('Creating voice task:', {
        user_id: user.id,
        email: user.email,
        taskContent: taskData.taskContent.substring(0, 100) + '...',
        priority: taskData.priority,
        manualAgentOverride: taskData.manualAgentOverride
      })

      // Step 1: Get agent routing recommendation
      console.log('Voice Task - Step 1: Getting agent routing...')
      const { data: routingData, error: routingError } = await supabase.functions.invoke('task-router', {
        body: {
          taskContent: taskData.taskContent,
          manualAgentOverride: taskData.manualAgentOverride,
          userPreferences: { preferLowerCost: true }
        }
      })

      if (routingError) {
        console.error('Voice task routing failed:', routingError)
        throw new Error(`Voice task routing failed: ${routingError.message}`)
      }

      if (!routingData?.data) {
        console.error('No routing data received for voice task')
        throw new Error('No routing data received from task router')
      }

      const selectedAgent = routingData.data.selectedAgent
      const reasoning = routingData.data.reasoning

      console.log('Voice task agent routing successful:', {
        selectedAgent,
        reasoning: reasoning?.substring(0, 100) + '...'
      })

      // Step 2: Create task record in database
      console.log('Voice Task - Step 2: Creating task record in database...')
      const taskRecord = {
        user_id: user.id,
        task_content: taskData.taskContent,
        selected_agent: selectedAgent,
        agent_reasoning: reasoning,
        status: 'pending' as const,
        priority: taskData.priority || 'normal',
        estimated_cost: 0
      }

      console.log('Voice task - inserting task record:', {
        ...taskRecord,
        task_content: taskRecord.task_content.substring(0, 50) + '...',
        agent_reasoning: taskRecord.agent_reasoning?.substring(0, 50) + '...'
      })

      const { data: insertedTask, error: taskError } = await supabase
        .from('tasks')
        .insert(taskRecord)
        .select()
        .single()

      if (taskError) {
        console.error('Voice task insertion failed:', {
          error: taskError,
          user_id: user.id,
          auth_state: !!user,
          session: await supabase.auth.getSession()
        })
        throw new Error(`Failed to create voice task: ${taskError.message}`)
      }

      if (!insertedTask) {
        console.error('No voice task returned after insertion')
        throw new Error('Voice task was not created successfully')
      }

      console.log('Voice task created successfully:', {
        task_id: insertedTask.id,
        status: insertedTask.status,
        selected_agent: insertedTask.selected_agent
      })

      // Step 3: Trigger task processing (async)
      console.log('Voice Task - Step 3: Triggering task processing...')
      const processingResult = supabase.functions.invoke('task-processor', {
        body: {
          taskId: insertedTask.id,
          taskContent: taskData.taskContent,
          selectedAgent,
          priority: taskData.priority || 'normal'
        }
      })

      // Don't await the processing - it's async
      processingResult.then((result) => {
        if (result.error) {
          console.error('Voice task processing invocation failed:', result.error)
        } else {
          console.log('Voice task processing triggered successfully')
        }
      })

      return { task: insertedTask, routing: routingData.data }
    },
    onSuccess: (data) => {
      console.log('Voice task creation mutation successful:', data.task.id)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`🎤 Voice task submitted successfully! (ID: ${data.task.id.slice(-8)})`)
      return data.task // Return the task for monitoring
    },
    onError: (error: any) => {
      console.error('Voice task creation mutation failed:', error)
      toast.error(`Voice task failed: ${error.message || 'Unknown error'}`)
    }
  })

  return {
    createVoiceTask: createVoiceTaskMutation.mutateAsync, // Use mutateAsync to get the result
    isCreating: createVoiceTaskMutation.isPending
  }
}
