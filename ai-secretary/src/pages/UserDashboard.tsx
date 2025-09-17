import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface DashboardData {
  user: any
  credits: {
    balance: number
    monthlyLimit: number
  }
  tasks: {
    recent: any[]
    statistics: {
      total: number
      completed: number
      processing: number
      failed: number
    }
  }
  agents: Array<{
    id: string
    name: string
    displayName: string
    description: string
    capabilities: string[]
  }>
}

export function UserDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskContent, setTaskContent] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [submittingTask, setSubmittingTask] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [user?.id])

  async function loadDashboardData() {
    try {
      const { data, error } = await supabase.functions.invoke('user-dashboard-data', {
        body: { action: 'dashboard', userId: user?.id }
      })

      if (error) throw error
      setDashboardData(data.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTaskSubmission() {
    if (!taskContent || !selectedAgent) return

    setSubmittingTask(true)
    try {
      const { data, error } = await supabase.functions.invoke('user-dashboard-data', {
        body: {
          action: 'create_task',
          userId: user?.id,
          taskContent,
          selectedAgent,
          priority: 'normal'
        }
      })

      if (error) throw error
      
      // Reset form
      setTaskContent('')
      setSelectedAgent('')
      
      // Reload dashboard
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setSubmittingTask(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Failed to load dashboard data</div>
      </div>
    )
  }

  const { user: userData, credits, tasks, agents } = dashboardData
  const creditUsagePercentage = Math.min(100, (credits.monthlyLimit - credits.balance) / credits.monthlyLimit * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userData.full_name}</h1>
              <p className="text-gray-600">Your AEROS personal assistant dashboard</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Plan</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">{userData.subscription_tier}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">C</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Available Credits</dt>
                        <dd className="text-lg font-medium text-gray-900">{credits.balance}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.max(5, 100 - creditUsagePercentage)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {credits.monthlyLimit - credits.balance} used of {credits.monthlyLimit} monthly limit
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">T</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">{tasks.statistics.completed}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      {tasks.statistics.total} total • {tasks.statistics.processing} processing
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">A</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Available Agents</dt>
                        <dd className="text-lg font-medium text-gray-900">{agents.length}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      Ready to assist with your tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create New Task */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Description</label>
                    <textarea
                      value={taskContent}
                      onChange={(e) => setTaskContent(e.target.value)}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="Describe what you need help with..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Agent</label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Choose an AI agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.name}>
                          {agent.displayName} - {agent.description.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleTaskSubmission}
                    disabled={!taskContent || !selectedAgent || submittingTask}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingTask ? 'Creating Task...' : 'Create Task'}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
              </div>
              <div className="p-6">
                {tasks.recent.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.recent.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{task.task_content}</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>Agent: {task.selected_agent}</span>
                              <span>Priority: {task.priority}</span>
                              <span>{new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No tasks yet. Create your first task above!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Agents */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Available Agents</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {agents.slice(0, 4).map((agent) => (
                    <div key={agent.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-sm text-gray-900">{agent.displayName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {agent.capabilities?.slice(0, 3).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="text-sm font-medium text-gray-900">{userData.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Plan</div>
                    <div className="text-sm font-medium text-gray-900 capitalize">{userData.subscription_tier}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {userData.subscription_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
