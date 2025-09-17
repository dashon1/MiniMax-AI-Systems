import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Send, Bot, MessageSquare, FileText, Database, Brain } from 'lucide-react'

interface APITestResult {
  success: boolean
  data?: any
  error?: string
  responseTime?: number
}

export function APITestingPlayground() {
  const { user } = useAuth()
  const [selectedAPI, setSelectedAPI] = useState('openai')
  const [testResults, setTestResults] = useState<Record<string, APITestResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [testConfigs, setTestConfigs] = useState<Record<string, any>>({
    openai: {
      service: 'chat_completion',
      messages: [{ role: 'user', content: 'Hello! Test message from AEROS platform.' }],
      model: 'gpt-4o-mini',
      max_tokens: 100
    },
    discord: {
      action: 'get_bot_info'
    },
    telegram: {
      action: 'get_bot_info'
    },
    github: {
      action: 'get_user_info'
    },
    airtable: {
      action: 'get_base_schema',
      baseId: 'appXXXXXXXXXXXXXX'
    },
    anthropic: {
      action: 'messages',
      messages: [{ role: 'user', content: 'Hello! Test message from AEROS platform.' }],
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100
    },
    huggingface: {
      action: 'text_generation',
      inputs: 'Hello, this is a test from AEROS platform.',
      model: 'gpt2',
      max_length: 50
    },
    replicate: {
      action: 'list_models',
      limit: 5
    },
    slack: {
      action: 'list_channels',
      limit: 10
    },
    google_sheets: {
      action: 'create_spreadsheet',
      title: 'AEROS Test Spreadsheet'
    }
  })

  const apiCategories = {
    'AI/ML Services': [
      { name: 'openai', displayName: 'OpenAI', icon: Brain },
      { name: 'anthropic', displayName: 'Anthropic Claude', icon: Brain },
      { name: 'huggingface', displayName: 'Hugging Face', icon: Brain },
      { name: 'replicate', displayName: 'Replicate', icon: Brain }
    ],
    'Communication': [
      { name: 'discord', displayName: 'Discord Bot', icon: MessageSquare },
      { name: 'telegram', displayName: 'Telegram Bot', icon: MessageSquare },
      { name: 'slack', displayName: 'Slack', icon: MessageSquare }
    ],
    'Development & Data': [
      { name: 'github', displayName: 'GitHub', icon: FileText },
      { name: 'airtable', displayName: 'Airtable', icon: Database },
      { name: 'google_sheets', displayName: 'Google Sheets', icon: FileText }
    ]
  }

  const testAPI = async (apiName: string) => {
    setLoading(prev => ({ ...prev, [apiName]: true }))
    
    try {
      const config = testConfigs[apiName]
      const functionName = `${apiName.replace('_', '-')}-integration`
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: config
      })

      if (error) throw error

      setTestResults(prev => ({
        ...prev,
        [apiName]: {
          success: true,
          data: data.data,
          responseTime: Date.now() // Simplified - would need actual timing
        }
      }))
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [apiName]: {
          success: false,
          error: error.message
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [apiName]: false }))
    }
  }

  const updateTestConfig = (apiName: string, config: any) => {
    setTestConfigs(prev => ({
      ...prev,
      [apiName]: { ...prev[apiName], ...config }
    }))
  }

  const renderTestConfig = (apiName: string) => {
    const config = testConfigs[apiName]

    switch (apiName) {
      case 'openai':
        return (
          <div className="space-y-4">
            <div>
              <Label>Service</Label>
              <Select 
                value={config.service} 
                onValueChange={(value) => updateTestConfig(apiName, { service: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat_completion">Chat Completion</SelectItem>
                  <SelectItem value="image_generation">Image Generation</SelectItem>
                  <SelectItem value="audio_transcription">Audio Transcription</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.service === 'chat_completion' && (
              <>
                <div>
                  <Label>Model</Label>
                  <Input 
                    value={config.model}
                    onChange={(e) => updateTestConfig(apiName, { model: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea 
                    value={config.messages[0].content}
                    onChange={(e) => updateTestConfig(apiName, { 
                      messages: [{ role: 'user', content: e.target.value }] 
                    })}
                  />
                </div>
              </>
            )}
            {config.service === 'image_generation' && (
              <div>
                <Label>Prompt</Label>
                <Textarea 
                  placeholder="Describe the image you want to generate"
                  onChange={(e) => updateTestConfig(apiName, { prompt: e.target.value })}
                />
              </div>
            )}
          </div>
        )

      case 'discord':
      case 'telegram':
        return (
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select 
                value={config.action} 
                onValueChange={(value) => updateTestConfig(apiName, { action: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="get_bot_info">Get Bot Info</SelectItem>
                  <SelectItem value="send_message">Send Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.action === 'send_message' && (
              <>
                <div>
                  <Label>{apiName === 'discord' ? 'Channel ID' : 'Chat ID'}</Label>
                  <Input 
                    placeholder={apiName === 'discord' ? 'Discord channel ID' : 'Telegram chat ID'}
                    onChange={(e) => updateTestConfig(apiName, { 
                      [apiName === 'discord' ? 'channelId' : 'chat_id']: e.target.value 
                    })}
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea 
                    placeholder="Test message"
                    onChange={(e) => updateTestConfig(apiName, { 
                      [apiName === 'discord' ? 'content' : 'text']: e.target.value 
                    })}
                  />
                </div>
              </>
            )}
          </div>
        )

      case 'github':
        return (
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select 
                value={config.action} 
                onValueChange={(value) => updateTestConfig(apiName, { action: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="get_user_info">Get User Info</SelectItem>
                  <SelectItem value="list_repositories">List Repositories</SelectItem>
                  <SelectItem value="create_repository">Create Repository</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.action === 'create_repository' && (
              <>
                <div>
                  <Label>Repository Name</Label>
                  <Input 
                    placeholder="test-repo"
                    onChange={(e) => updateTestConfig(apiName, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input 
                    placeholder="Test repository created via AEROS"
                    onChange={(e) => updateTestConfig(apiName, { description: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label>Test Configuration</Label>
              <Textarea 
                value={JSON.stringify(config, null, 2)}
                onChange={(e) => {
                  try {
                    const newConfig = JSON.parse(e.target.value)
                    setTestConfigs(prev => ({ ...prev, [apiName]: newConfig }))
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                className="font-mono text-sm"
                rows={8}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Testing Playground</h1>
        <p className="mt-1 text-sm text-gray-600">Test and experiment with all integrated APIs</p>
      </div>

      <Tabs defaultValue="ai_ml" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai_ml">AI/ML Services</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="development">Development & Data</TabsTrigger>
        </TabsList>

        {Object.entries(apiCategories).map(([categoryName, apis]) => {
          const tabValue = categoryName.toLowerCase().replace(/[^a-z]/g, '_')
          
          return (
            <TabsContent key={tabValue} value={tabValue.replace('__', '_')}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {apis.map((api) => {
                  const IconComponent = api.icon
                  const result = testResults[api.name]
                  const isLoading = loading[api.name]
                  
                  return (
                    <Card key={api.name} className="h-fit">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-6 w-6 text-blue-500" />
                          <div>
                            <CardTitle>{api.displayName}</CardTitle>
                            <CardDescription>Test {api.displayName} integration</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {renderTestConfig(api.name)}
                          
                          <Button 
                            onClick={() => testAPI(api.name)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {isLoading ? 'Testing...' : 'Test API'}
                          </Button>

                          {result && (
                            <div className="mt-4">
                              <div className="flex items-center space-x-2 mb-2">
                                {result.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <Badge variant={result.success ? 'default' : 'destructive'}>
                                  {result.success ? 'Success' : 'Failed'}
                                </Badge>
                                {result.responseTime && (
                                  <Badge variant="outline">
                                    {result.responseTime}ms
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                {result.success ? (
                                  <pre className="whitespace-pre-wrap font-mono text-xs">
                                    {JSON.stringify(result.data, null, 2)}
                                  </pre>
                                ) : (
                                  <div className="text-red-600">
                                    {result.error}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}