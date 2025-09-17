import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Mic, Database, Server, AlertTriangle, CheckCircle, XCircle, RefreshCw, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

export function TaskPipelineDebugger() {
  const { user } = useAuth()
  const { createTask, isCreating } = useTasks()
  const [debugResults, setDebugResults] = useState<string[]>([])
  const [isTestingPipeline, setIsTestingPipeline] = useState(false)
  
  const addDebugResult = useCallback((result: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugResults(prev => [...prev, `${timestamp}: ${result}`])
  }, [])
  
  const clearResults = useCallback(() => {
    setDebugResults([])
  }, [])
  
  const testDatabaseConnection = useCallback(async () => {
    try {
      addDebugResult('Testing database connection...')
      
      // Test basic connection
      const { data, error } = await supabase.from('tasks').select('count').limit(1)
      
      if (error) {
        addDebugResult(`❌ Database connection failed: ${error.message}`)
        return false
      }
      
      addDebugResult('✅ Database connection successful')
      return true
    } catch (error: any) {
      addDebugResult(`❌ Database test error: ${error.message}`)
      return false
    }
  }, [addDebugResult])
  
  const testAuthentication = useCallback(async () => {
    try {
      addDebugResult('Testing authentication...')
      
      if (!user) {
        addDebugResult('❌ No user authenticated')
        return false
      }
      
      addDebugResult(`✅ User authenticated: ${user.email} (ID: ${user.id})`)
      
      // Test session validity
      const { data: session, error } = await supabase.auth.getSession()
      
      if (error || !session.session) {
        addDebugResult(`❌ Session invalid: ${error?.message || 'No session'}`)
        return false
      }
      
      addDebugResult('✅ Session valid')
      return true
    } catch (error: any) {
      addDebugResult(`❌ Auth test error: ${error.message}`)
      return false
    }
  }, [user, addDebugResult])
  
  const testTaskRouterFunction = useCallback(async () => {
    try {
      addDebugResult('Testing task-router edge function...')
      
      const { data, error } = await supabase.functions.invoke('task-router', {
        body: {
          taskContent: 'Test task for debugging pipeline',
          userPreferences: { preferLowerCost: true }
        }
      })
      
      if (error) {
        addDebugResult(`❌ Task router failed: ${error.message}`)
        return false
      }
      
      if (!data?.data?.selectedAgent) {
        addDebugResult('❌ Task router returned invalid data')
        return false
      }
      
      addDebugResult(`✅ Task router successful: ${data.data.selectedAgent}`)
      return true
    } catch (error: any) {
      addDebugResult(`❌ Task router error: ${error.message}`)
      return false
    }
  }, [addDebugResult])
  
  const testTaskCreation = useCallback(async () => {
    try {
      addDebugResult('Testing task creation...')
      
      if (!user) {
        addDebugResult('❌ Cannot test task creation: No user')
        return false
      }
      
      // Test direct database insertion
      const testTask = {
        user_id: user.id,
        task_content: 'DEBUG: Test task creation pipeline',
        selected_agent: 'genspark',
        agent_reasoning: 'Debug test task',
        status: 'pending' as const,
        priority: 'normal' as const,
        estimated_cost: 0
      }
      
      const { data: insertedTask, error } = await supabase
        .from('tasks')
        .insert(testTask)
        .select()
        .single()
      
      if (error) {
        addDebugResult(`❌ Task creation failed: ${error.message}`)
        addDebugResult(`   Error details: ${JSON.stringify(error, null, 2)}`)
        return false
      }
      
      if (!insertedTask) {
        addDebugResult('❌ Task creation failed: No task returned')
        return false
      }
      
      addDebugResult(`✅ Task created successfully: ${insertedTask.id}`)
      
      // Clean up test task
      await supabase.from('tasks').delete().eq('id', insertedTask.id)
      addDebugResult('🧹 Test task cleaned up')
      
      return true
    } catch (error: any) {
      addDebugResult(`❌ Task creation test error: ${error.message}`)
      return false
    }
  }, [user, addDebugResult])
  
  const testTaskProcessorFunction = useCallback(async () => {
    try {
      addDebugResult('Testing task-processor edge function...')
      
      // Create a real test task first
      if (!user) {
        addDebugResult('❌ Cannot test processor: No user')
        return false
      }
      
      const testTask = {
        user_id: user.id,
        task_content: 'DEBUG: Test task processor pipeline',
        selected_agent: 'genspark',
        agent_reasoning: 'Debug test for processor',
        status: 'pending' as const,
        priority: 'normal' as const,
        estimated_cost: 0
      }
      
      const { data: insertedTask, error: insertError } = await supabase
        .from('tasks')
        .insert(testTask)
        .select()
        .single()
      
      if (insertError || !insertedTask) {
        addDebugResult('❌ Cannot create test task for processor test')
        return false
      }
      
      // Test processor function
      const { data, error } = await supabase.functions.invoke('task-processor', {
        body: {
          taskId: insertedTask.id,
          taskContent: testTask.task_content,
          selectedAgent: testTask.selected_agent,
          priority: testTask.priority
        }
      })
      
      if (error) {
        addDebugResult(`❌ Task processor failed: ${error.message}`)
        // Clean up
        await supabase.from('tasks').delete().eq('id', insertedTask.id)
        return false
      }
      
      addDebugResult('✅ Task processor function invoked successfully')
      
      // Check if task status was updated
      setTimeout(async () => {
        const { data: updatedTask } = await supabase
          .from('tasks')
          .select('status')
          .eq('id', insertedTask.id)
          .single()
        
        if (updatedTask?.status === 'processing' || updatedTask?.status === 'completed') {
          addDebugResult('✅ Task status updated by processor')
        } else {
          addDebugResult('⚠️ Task status not updated yet (may be processing)')
        }
        
        // Clean up test task
        await supabase.from('tasks').delete().eq('id', insertedTask.id)
        addDebugResult('🧹 Test task cleaned up')
      }, 2000)
      
      return true
    } catch (error: any) {
      addDebugResult(`❌ Task processor test error: ${error.message}`)
      return false
    }
  }, [user, addDebugResult])
  
  const runFullPipelineTest = useCallback(async () => {
    setIsTestingPipeline(true)
    clearResults()
    
    try {
      addDebugResult('🚀 Starting comprehensive pipeline test...')
      
      // Test each component
      const dbTest = await testDatabaseConnection()
      const authTest = await testAuthentication()
      const routerTest = await testTaskRouterFunction()
      const creationTest = await testTaskCreation()
      const processorTest = await testTaskProcessorFunction()
      
      // Summary
      addDebugResult('\n📊 Test Summary:')
      addDebugResult(`   Database: ${dbTest ? '✅' : '❌'}`)
      addDebugResult(`   Authentication: ${authTest ? '✅' : '❌'}`)
      addDebugResult(`   Task Router: ${routerTest ? '✅' : '❌'}`)
      addDebugResult(`   Task Creation: ${creationTest ? '✅' : '❌'}`)
      addDebugResult(`   Task Processor: ${processorTest ? '✅' : '❌'}`)
      
      const allPassed = dbTest && authTest && routerTest && creationTest && processorTest
      
      if (allPassed) {
        addDebugResult('\n🎉 All tests passed! Pipeline is working correctly.')
        toast.success('Pipeline test completed successfully!')
      } else {
        addDebugResult('\n⚠️ Some tests failed. Check the results above.')
        toast.error('Pipeline test found issues')
      }
      
    } catch (error: any) {
      addDebugResult(`❌ Pipeline test failed: ${error.message}`)
      toast.error('Pipeline test failed')
    } finally {
      setIsTestingPipeline(false)
    }
  }, [testDatabaseConnection, testAuthentication, testTaskRouterFunction, testTaskCreation, testTaskProcessorFunction, addDebugResult, clearResults])
  
  const testVoiceTaskSubmission = useCallback(async () => {
    try {
      addDebugResult('🎤 Testing voice task submission...')
      
      createTask({
        taskContent: 'DEBUG: Voice task pipeline test - please create a simple task summary',
        priority: 'normal'
      })
      
      addDebugResult('✅ Voice task submission initiated')
      toast.success('Voice task test initiated - check task history')
      
    } catch (error: any) {
      addDebugResult(`❌ Voice task test failed: ${error.message}`)
      toast.error('Voice task test failed')
    }
  }, [createTask, addDebugResult])
  
  const getStatusIcon = (condition: boolean | null) => {
    if (condition === null) return <Activity className="h-4 w-4 text-gray-500" />
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Task Pipeline Debugger
        </CardTitle>
        <CardDescription>
          Comprehensive testing and debugging for the voice task processing pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Pipeline Tests</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={testDatabaseConnection} variant="outline" size="sm">
              <Database className="h-4 w-4 mr-1" />
              Test Database
            </Button>
            <Button onClick={testAuthentication} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Test Auth
            </Button>
            <Button onClick={testTaskRouterFunction} variant="outline" size="sm">
              <Server className="h-4 w-4 mr-1" />
              Test Router
            </Button>
            <Button onClick={testTaskCreation} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-1" />
              Test Creation
            </Button>
            <Button onClick={testTaskProcessorFunction} variant="outline" size="sm">
              <Mic className="h-4 w-4 mr-1" />
              Test Processor
            </Button>
            <Button onClick={testVoiceTaskSubmission} variant="outline" size="sm">
              <Mic className="h-4 w-4 mr-1" />
              Test Voice Task
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={runFullPipelineTest} 
              disabled={isTestingPipeline}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {isTestingPipeline ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Testing Pipeline...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-1" />
                  Run Full Pipeline Test
                </>
              )}
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
        </div>
        
        {/* Current Status */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Current Status</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!user)}
              <span className="text-sm">User Authentication: {user ? 'Logged In' : 'Not Logged In'}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(null)}
              <span className="text-sm">Task Creation: {isCreating ? 'In Progress' : 'Ready'}</span>
            </div>
          </div>
          {user && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <strong>User:</strong> {user.email} (ID: {user.id})
            </div>
          )}
        </div>
        
        {/* Debug Results */}
        {debugResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Debug Results</h3>
            <div className="max-h-80 overflow-y-auto bg-muted p-3 rounded text-sm font-mono space-y-1">
              {debugResults.map((result, index) => (
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
