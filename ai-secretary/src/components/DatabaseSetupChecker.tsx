import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Database, Users, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export function DatabaseSetupChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [setupResults, setSetupResults] = useState<string[]>([])
  
  const addResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setSetupResults(prev => [...prev, `${timestamp}: ${result}`])
  }
  
  const clearResults = () => {
    setSetupResults([])
  }
  
  const checkAgentCapabilities = async () => {
    try {
      addResult('Checking agent_capabilities table...')
      
      const { data, error } = await supabase
        .from('agent_capabilities')
        .select('*')
      
      if (error) {
        addResult(`❌ Agent capabilities query failed: ${error.message}`)
        return false
      }
      
      if (!data || data.length === 0) {
        addResult('⚠️ Agent capabilities table is empty - this will cause routing failures')
        return false
      }
      
      addResult(`✅ Found ${data.length} agent capabilities`)
      data.forEach(agent => {
        addResult(`   - ${agent.agent_name}: ${agent.is_active ? 'Active' : 'Inactive'}`)
      })
      
      return true
    } catch (error: any) {
      addResult(`❌ Agent capabilities check error: ${error.message}`)
      return false
    }
  }
  
  const seedAgentCapabilities = async () => {
    try {
      addResult('Seeding agent capabilities...')
      
      const agents = [
        {
          agent_name: 'genspark',
          capability_keywords: ['research', 'analysis', 'information', 'study', 'investigate', 'content', 'write', 'article'],
          description: 'Specialized in research, content creation, and information analysis',
          api_endpoint: '/api/agents/genspark',
          pricing_model: 'subscription',
          is_active: true
        },
        {
          agent_name: 'abacus',
          capability_keywords: ['code', 'programming', 'technical', 'development', 'software', 'algorithm', 'data', 'engineering'],
          description: 'Expert in technical development, coding, and data analysis',
          api_endpoint: '/api/agents/abacus',
          pricing_model: 'subscription',
          is_active: true
        },
        {
          agent_name: 'minimax',
          capability_keywords: ['creative', 'design', 'visual', 'content', 'marketing', 'brand', 'media'],
          description: 'Creative specialist for design, content, and marketing',
          api_endpoint: '/api/agents/minimax',
          pricing_model: 'subscription',
          is_active: true
        },
        {
          agent_name: 'manus',
          capability_keywords: ['business', 'strategy', 'workflow', 'automation', 'enterprise', 'management', 'optimization'],
          description: 'Business strategy and workflow optimization expert',
          api_endpoint: '/api/agents/manus',
          pricing_model: 'subscription',
          is_active: true
        }
      ]
      
      // First, check if agents already exist
      const { data: existingAgents } = await supabase
        .from('agent_capabilities')
        .select('agent_name')
      
      const existingNames = new Set(existingAgents?.map(a => a.agent_name) || [])
      const agentsToInsert = agents.filter(agent => !existingNames.has(agent.agent_name))
      
      if (agentsToInsert.length === 0) {
        addResult('✅ All agents already exist')
        return true
      }
      
      const { data, error } = await supabase
        .from('agent_capabilities')
        .insert(agentsToInsert)
        .select()
      
      if (error) {
        addResult(`❌ Failed to seed agents: ${error.message}`)
        return false
      }
      
      addResult(`✅ Successfully seeded ${agentsToInsert.length} agents`)
      return true
    } catch (error: any) {
      addResult(`❌ Agent seeding error: ${error.message}`)
      return false
    }
  }
  
  const checkTasksTable = async () => {
    try {
      addResult('Checking tasks table structure...')
      
      // Try to select with limit to check table access
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .limit(1)
      
      if (error) {
        addResult(`❌ Tasks table check failed: ${error.message}`)
        return false
      }
      
      addResult('✅ Tasks table accessible')
      
      // Count total tasks
      const { count, error: countError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        addResult(`⚠️ Could not count tasks: ${countError.message}`)
      } else {
        addResult(`   Total tasks in database: ${count || 0}`)
      }
      
      return true
    } catch (error: any) {
      addResult(`❌ Tasks table check error: ${error.message}`)
      return false
    }
  }
  
  const checkRLSPolicies = async () => {
    try {
      addResult('Checking RLS policies...')
      
      // This is a bit tricky to check programmatically, so we'll do a practical test
      // Try to access tasks table and see if RLS is working
      
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session) {
        addResult('⚠️ No active session for RLS test')
        return false
      }
      
      addResult('✅ Active session found for RLS test')
      
      // Try to select tasks (should only return user's tasks due to RLS)
      const { data, error } = await supabase
        .from('tasks')
        .select('user_id')
        .limit(5)
      
      if (error) {
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          addResult(`❌ RLS policy issue: ${error.message}`)
          return false
        } else {
          addResult(`⚠️ Tasks query failed (may be expected): ${error.message}`)
        }
      } else {
        addResult('✅ RLS policies appear to be working')
        if (data && data.length > 0) {
          const userIds = new Set(data.map(t => t.user_id))
          addResult(`   Found tasks for ${userIds.size} user(s)`)
        }
      }
      
      return true
    } catch (error: any) {
      addResult(`❌ RLS check error: ${error.message}`)
      return false
    }
  }
  
  const runFullSetupCheck = async () => {
    setIsChecking(true)
    clearResults()
    
    try {
      addResult('🚀 Starting database setup check...')
      
      const agentCheck = await checkAgentCapabilities()
      const tasksCheck = await checkTasksTable()
      const rlsCheck = await checkRLSPolicies()
      
      addResult('\n📊 Setup Check Summary:')
      addResult(`   Agent Capabilities: ${agentCheck ? '✅' : '❌'}`)
      addResult(`   Tasks Table: ${tasksCheck ? '✅' : '❌'}`)
      addResult(`   RLS Policies: ${rlsCheck ? '✅' : '❌'}`)
      
      if (!agentCheck) {
        addResult('\n⚠️ Agent capabilities need to be seeded!')
      }
      
      const allGood = agentCheck && tasksCheck && rlsCheck
      
      if (allGood) {
        addResult('\n🎉 Database setup looks good!')
        toast.success('Database setup check completed')
      } else {
        addResult('\n⚠️ Some issues found - check results above')
        toast.error('Database setup issues detected')
      }
      
    } catch (error: any) {
      addResult(`❌ Setup check failed: ${error.message}`)
      toast.error('Database setup check failed')
    } finally {
      setIsChecking(false)
    }
  }
  
  const fixAgentCapabilities = async () => {
    const success = await seedAgentCapabilities()
    if (success) {
      toast.success('Agent capabilities seeded successfully')
    } else {
      toast.error('Failed to seed agent capabilities')
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup Checker
        </CardTitle>
        <CardDescription>
          Check and fix database setup issues that could cause task processing failures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Setup Checks</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={checkAgentCapabilities} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" />
              Check Agents
            </Button>
            <Button onClick={checkTasksTable} variant="outline" size="sm">
              <Database className="h-4 w-4 mr-1" />
              Check Tasks
            </Button>
            <Button onClick={checkRLSPolicies} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Check RLS
            </Button>
            <Button onClick={fixAgentCapabilities} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Seed Agents
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={runFullSetupCheck} 
              disabled={isChecking}
              className="bg-gradient-to-r from-green-500 to-blue-500"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Checking Setup...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-1" />
                  Run Full Setup Check
                </>
              )}
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
        </div>
        
        {/* Setup Results */}
        {setupResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Setup Results</h3>
            <div className="max-h-80 overflow-y-auto bg-muted p-3 rounded text-sm font-mono space-y-1">
              {setupResults.map((result, index) => (
                <div key={index} className="text-xs whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
