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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Voice task submitted successfully!')
      return data.task // Return the task for monitoring
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit voice task')
    }
  })

  return {
    createVoiceTask: createVoiceTaskMutation.mutateAsync, // Use mutateAsync to get the result
    isCreating: createVoiceTaskMutation.isPending
  }
}