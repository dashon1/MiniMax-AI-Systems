import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Agent {
  id: string
  agent_name: string
  displayName: string
  description: string
  capability_keywords: string[]
  is_active: boolean
  usageCount: number
  performanceMetrics: {
    efficiency: number
    responseTime: number
    accuracy: number
  }
  coreSpecifications: string[]
  status: string
}

export function AdminAgents() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [user?.id])

  async function loadAgents() {
    try {
      const { data, error } = await supabase.functions.invoke('admin-agent-management', {
        body: { action: 'list', adminUserId: user?.id }
      })

      if (error) throw error
      setAgents(data.data || [])
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleAgentStatus(agentId: string, currentStatus: boolean) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-agent-management', {
        body: {
          action: 'toggle_status',
          adminUserId: user?.id,
          agentId: agentId,
          agentData: { is_active: !currentStatus }
        }
      })

      if (error) throw error
      await loadAgents()
    } catch (error) {
      console.error('Failed to toggle agent status:', error)
    }
  }

  async function deployAgent(agentId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-agent-management', {
        body: {
          action: 'deploy',
          adminUserId: user?.id,
          agentId: agentId
        }
      })

      if (error) throw error
      console.log('Deployment initiated:', data.data)
    } catch (error) {
      console.error('Failed to deploy agent:', error)
    }
  }

  function getAgentColor(agentName: string) {
    const colors = {
      'abacus': 'bg-green-500',
      'genspark': 'bg-blue-500', 
      'manus': 'bg-orange-500',
      'minimax': 'bg-purple-500',
      'mvp_agent': 'bg-red-500',
      'fullstack_dev': 'bg-indigo-500',
      'deep_research': 'bg-cyan-500',
      'report_writer': 'bg-gray-500'
    }
    return colors[agentName] || 'bg-gray-500'
  }

  function getAgentIcon(agentName: string) {
    const icons = {
      'abacus': 'A',
      'genspark': 'G', 
      'manus': 'M',
      'minimax': 'M',
      'mvp_agent': 'MVP',
      'fullstack_dev': 'FS',
      'deep_research': 'DR',
      'report_writer': 'RW'
    }
    return icons[agentName] || 'AG'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor and manage AI agents with performance metrics</p>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Agent Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${getAgentColor(agent.agent_name)} rounded-lg flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">{getAgentIcon(agent.agent_name)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{agent.displayName}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      agent.is_active 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Usage</div>
                  <div className="text-lg font-semibold text-gray-900">{agent.usageCount}</div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{agent.description}</p>
            </div>

            {/* Performance Metrics */}
            <div className="px-6 pb-4">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Metrics</h4>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Efficiency</span>
                      <span>{agent.performanceMetrics.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${agent.performanceMetrics.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Response Time</span>
                      <span>{agent.performanceMetrics.responseTime}s</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.max(10, 100 - (agent.performanceMetrics.responseTime * 20))}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Accuracy</span>
                      <span>{agent.performanceMetrics.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${agent.performanceMetrics.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Specifications */}
            <div className="px-6 pb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Core Specifications</h4>
              <div className="flex flex-wrap gap-1">
                {agent.coreSpecifications.map((spec, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => deployAgent(agent.id)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                    agent.is_active
                      ? getAgentColor(agent.agent_name) + ' text-white hover:opacity-90'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!agent.is_active}
                >
                  Deploy Agent
                </button>
                <button
                  onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${
                    agent.is_active
                      ? 'border-red-300 text-red-700 hover:bg-red-50'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {agent.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Statistics */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Agent Performance Overview</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{agents.filter(a => a.is_active).length}</div>
              <div className="text-sm text-gray-600">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {agents.reduce((sum, agent) => sum + agent.usageCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Usage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(agents.reduce((sum, agent) => sum + agent.performanceMetrics.efficiency, 0) / agents.length)}%
              </div>
              <div className="text-sm text-gray-600">Average Efficiency</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
