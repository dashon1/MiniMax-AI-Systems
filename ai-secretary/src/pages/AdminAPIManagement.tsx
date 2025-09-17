import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, XCircle, Clock, Activity, Settings, TestTube, BarChart3 } from 'lucide-react'

interface APIConfig {
  id: string
  api_name: string
  api_category: string
  display_name: string
  description: string
  status: string
  is_configured: boolean
  rate_limit_per_minute: number
  rate_limit_per_hour: number
  rate_limit_per_day: number
  cost_per_request: number
  health_status: string
  last_health_check: string
}

interface APIUsageStats {
  totalRequests7Days: number
  totalRequests24Hours: number
  totalCost7Days: number
  averageResponseTime: number
  errorRate: number
}

export function AdminAPIManagement() {
  const { user } = useAuth()
  const [apis, setAPIs] = useState<APIConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAPI, setSelectedAPI] = useState<string | null>(null)
  const [usageStats, setUsageStats] = useState<Record<string, APIUsageStats>>({})
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [healthCheckLoading, setHealthCheckLoading] = useState(false)

  useEffect(() => {
    loadAPIs()
  }, [])

  const loadAPIs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { action: 'list_apis' }
      })

      if (error) throw error
      setAPIs(data.data || [])
      
      // Load usage stats for each API
      for (const api of data.data || []) {
        await loadUsageStats(api.api_name)
      }
    } catch (error) {
      console.error('Failed to load APIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsageStats = async (apiName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { action: 'get_usage_stats', apiName }
      })

      if (error) throw error
      setUsageStats(prev => ({ ...prev, [apiName]: data.data }))
    } catch (error) {
      console.error(`Failed to load usage stats for ${apiName}:`, error)
    }
  }

  const updateAPIConfig = async (apiName: string, config: Partial<APIConfig>) => {
    try {
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { action: 'update_api_config', apiName, config }
      })

      if (error) throw error
      await loadAPIs() // Reload to get updated data
    } catch (error) {
      console.error('Failed to update API config:', error)
    }
  }

  const testAPIConnection = async (apiName: string) => {
    try {
      setTestResults(prev => ({ ...prev, [apiName]: { loading: true } }))
      
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { action: 'test_api_connection', apiName, testData: {} }
      })

      if (error) throw error
      setTestResults(prev => ({ ...prev, [apiName]: data.data }))
    } catch (error) {
      console.error('Failed to test API connection:', error)
      setTestResults(prev => ({ 
        ...prev, 
        [apiName]: { 
          success: false, 
          error: error.message, 
          message: 'Connection test failed' 
        } 
      }))
    }
  }

  const runHealthCheckAll = async () => {
    setHealthCheckLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('api-integration-manager', {
        body: { action: 'health_check_all' }
      })

      if (error) throw error
      await loadAPIs() // Reload to get updated health status
    } catch (error) {
      console.error('Failed to run health check:', error)
    } finally {
      setHealthCheckLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'degraded': return 'bg-yellow-100 text-yellow-800'
      case 'down': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai_ml': return 'bg-purple-100 text-purple-800'
      case 'communication': return 'bg-blue-100 text-blue-800'
      case 'development': return 'bg-green-100 text-green-800'
      case 'data': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const apisByCategory = apis.reduce((acc, api) => {
    if (!acc[api.api_category]) acc[api.api_category] = []
    acc[api.api_category].push(api)
    return acc
  }, {} as Record<string, APIConfig[]>)

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Integration Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage and monitor all external API integrations</p>
          </div>
          <Button 
            onClick={runHealthCheckAll}
            disabled={healthCheckLoading}
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>{healthCheckLoading ? 'Checking...' : 'Health Check All'}</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai_ml">AI/ML Services</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="data">Data & Productivity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{apis.filter(api => api.status === 'active').length}</p>
                    <p className="text-sm text-gray-600">Active APIs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{apis.filter(api => api.health_status === 'healthy').length}</p>
                    <p className="text-sm text-gray-600">Healthy APIs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Object.values(usageStats).reduce((sum, stats) => sum + stats.totalRequests24Hours, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Requests (24h)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Settings className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{apis.filter(api => api.is_configured).length}</p>
                    <p className="text-sm text-gray-600">Configured</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apis.map((api) => (
              <Card key={api.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(api.status)}
                      <CardTitle className="text-lg">{api.display_name}</CardTitle>
                    </div>
                    <Badge className={getCategoryColor(api.api_category)}>
                      {api.api_category.replace('_', '/')}
                    </Badge>
                  </div>
                  <CardDescription>{api.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={getHealthStatusColor(api.health_status)}>
                          {api.health_status || 'unknown'}
                        </Badge>
                        <Switch 
                          checked={api.status === 'active'}
                          onCheckedChange={(checked) => 
                            updateAPIConfig(api.api_name, { status: checked ? 'active' : 'inactive' })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rate Limit</span>
                      <span className="text-sm font-mono">{api.rate_limit_per_minute}/min</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cost</span>
                      <span className="text-sm font-mono">${api.cost_per_request}/req</span>
                    </div>

                    {usageStats[api.api_name] && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>24h requests: {usageStats[api.api_name].totalRequests24Hours}</div>
                        <div>Avg response: {usageStats[api.api_name].averageResponseTime}ms</div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => testAPIConnection(api.api_name)}
                        disabled={testResults[api.api_name]?.loading}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        {testResults[api.api_name]?.loading ? 'Testing...' : 'Test'}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>

                    {testResults[api.api_name] && !testResults[api.api_name].loading && (
                      <div className={`text-xs p-2 rounded ${
                        testResults[api.api_name].success 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {testResults[api.api_name].message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {Object.entries(apisByCategory).map(([category, categoryAPIs]) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryAPIs.map((api) => (
                <Card key={api.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(api.status)}
                        <CardTitle className="text-lg">{api.display_name}</CardTitle>
                      </div>
                      <Badge className={getHealthStatusColor(api.health_status)}>
                        {api.health_status || 'unknown'}
                      </Badge>
                    </div>
                    <CardDescription>{api.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Rate Limit</span>
                          <p className="font-mono">{api.rate_limit_per_minute}/min</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost/Request</span>
                          <p className="font-mono">${api.cost_per_request}</p>
                        </div>
                      </div>

                      {usageStats[api.api_name] && (
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                          <div className="flex justify-between">
                            <span>24h Requests:</span>
                            <span className="font-semibold">{usageStats[api.api_name].totalRequests24Hours}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>7d Cost:</span>
                            <span className="font-semibold">${usageStats[api.api_name].totalCost7Days.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Response:</span>
                            <span className="font-semibold">{usageStats[api.api_name].averageResponseTime}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Error Rate:</span>
                            <span className="font-semibold">{usageStats[api.api_name].errorRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => testAPIConnection(api.api_name)}
                          disabled={testResults[api.api_name]?.loading}
                        >
                          <TestTube className="h-3 w-3 mr-1" />
                          {testResults[api.api_name]?.loading ? 'Testing...' : 'Test'}
                        </Button>
                        <Switch 
                          checked={api.status === 'active'}
                          onCheckedChange={(checked) => 
                            updateAPIConfig(api.api_name, { status: checked ? 'active' : 'inactive' })
                          }
                        />
                      </div>

                      {testResults[api.api_name] && !testResults[api.api_name].loading && (
                        <div className={`text-xs p-2 rounded ${
                          testResults[api.api_name].success 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {testResults[api.api_name].message}
                          {testResults[api.api_name].responseTime && (
                            <span className="block mt-1">Response time: {testResults[api.api_name].responseTime}ms</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview (7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usageStats).map(([apiName, stats]) => (
                    <div key={apiName} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">{apiName}</span>
                      <div className="text-right text-sm">
                        <div>{stats.totalRequests7Days} requests</div>
                        <div className="text-gray-600">${stats.totalCost7Days.toFixed(4)} cost</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usageStats).map(([apiName, stats]) => (
                    <div key={apiName} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">{apiName}</span>
                      <div className="text-right text-sm">
                        <div>{stats.averageResponseTime}ms avg</div>
                        <div className="text-gray-600">{stats.errorRate.toFixed(1)}% errors</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}