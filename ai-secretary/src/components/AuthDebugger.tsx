import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface DiagnosticResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export function AuthDebugger() {
  const [email, setEmail] = useState('ara-m5admin@gmail.com')
  const [password, setPassword] = useState('Aratest25')
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const { signIn } = useAuth()

  const addResult = (step: string, status: 'success' | 'error' | 'warning', message: string, details?: any) => {
    setResults(prev => [...prev, { step, status, message, details }])
  }

  const runDiagnostics = async () => {
    setTesting(true)
    setResults([])
    
    try {
      // Test 1: Supabase connection
      addResult('Connection', 'success', 'Testing Supabase connection...')
      
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        addResult('Connection', 'success', 'Supabase connection successful')
      } catch (error: any) {
        addResult('Connection', 'error', `Supabase connection failed: ${error.message}`)
        return
      }

      // Test 2: Direct authentication
      addResult('Auth Test', 'success', 'Testing direct authentication...')
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) {
          addResult('Auth Test', 'error', `Authentication failed: ${error.message}`, error)
        } else if (data.user) {
          addResult('Auth Test', 'success', 'Authentication successful!', {
            userId: data.user.id,
            email: data.user.email,
            lastSignIn: data.user.last_sign_in_at
          })
          
          // Test 3: Admin permissions check
          addResult('Admin Check', 'success', 'Checking admin permissions...')
          
          try {
            const { data: adminData, error: adminError } = await supabase
              .from('admin_users')
              .select('admin_level, permissions')
              .eq('user_id', data.user.id)
              .single()
            
            if (adminError) {
              addResult('Admin Check', 'warning', `Admin check failed: ${adminError.message}`)
            } else if (adminData) {
              addResult('Admin Check', 'success', 'Admin permissions found', {
                adminLevel: adminData.admin_level,
                permissions: adminData.permissions
              })
            } else {
              addResult('Admin Check', 'warning', 'No admin permissions found')
            }
          } catch (adminError: any) {
            addResult('Admin Check', 'error', `Admin check error: ${adminError.message}`)
          }
          
          // Test 4: User profile check
          addResult('Profile Check', 'success', 'Checking user profile...')
          
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single()
            
            if (profileError) {
              addResult('Profile Check', 'warning', `Profile check failed: ${profileError.message}`)
            } else if (profileData) {
              addResult('Profile Check', 'success', 'User profile found', {
                fullName: profileData.full_name,
                planType: profileData.plan_type
              })
            } else {
              addResult('Profile Check', 'warning', 'No user profile found')
            }
          } catch (profileError: any) {
            addResult('Profile Check', 'error', `Profile check error: ${profileError.message}`)
          }
        }
      } catch (authError: any) {
        addResult('Auth Test', 'error', `Authentication error: ${authError.message}`, authError)
      }
      
    } catch (error: any) {
      addResult('General', 'error', `General error: ${error.message}`, error)
    } finally {
      setTesting(false)
    }
  }

  const testFrontendLogin = async () => {
    setTesting(true)
    
    try {
      addResult('Frontend Login', 'success', 'Testing frontend login function...')
      
      const { error } = await signIn(email, password)
      
      if (error) {
        addResult('Frontend Login', 'error', `Frontend login failed: ${error.message}`, error)
        toast.error(`Login failed: ${error.message}`)
      } else {
        addResult('Frontend Login', 'success', 'Frontend login successful!')
        toast.success('Login successful!')
      }
    } catch (error: any) {
      addResult('Frontend Login', 'error', `Frontend login error: ${error.message}`, error)
      toast.error(`Login error: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-md">
      <Card className="bg-black/90 backdrop-blur-md border-blue-500/40">
        <CardHeader>
          <CardTitle className="text-white text-lg">Auth Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800/60 border-gray-600 text-white"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800/60 border-gray-600 text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={testing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Backend'}
            </Button>
            
            <Button
              onClick={testFrontendLogin}
              disabled={testing}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Frontend'}
            </Button>
          </div>
          
          {results.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              <h4 className="text-white font-medium">Test Results:</h4>
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="text-white font-medium">{result.step}</div>
                    <div className="text-gray-300">{result.message}</div>
                    {result.details && (
                      <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
