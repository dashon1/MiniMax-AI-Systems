import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { Mic, Square, CheckCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export function VoiceDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [micPermission, setMicPermission] = useState<PermissionState | 'unknown'>('unknown')
  const [testResults, setTestResults] = useState<string[]>([])
  
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupport
  } = useSpeechRecognition({
    onResult: (result) => {
      addTestResult(`Speech detected: "${result.transcript}" (${result.isFinal ? 'final' : 'interim'})`)
    },
    onError: (error) => {
      addTestResult(`Error: ${error}`)
    },
    onStart: () => {
      addTestResult('Speech recognition started successfully')
    },
    onEnd: () => {
      addTestResult('Speech recognition ended')
    }
  })
  
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }
  
  useEffect(() => {
    // Gather debug information
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      protocol: location.protocol,
      hostname: location.hostname,
      speechRecognition: !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition),
      webkitSpeechRecognition: !!((window as any).webkitSpeechRecognition),
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
      permissions: !!navigator.permissions,
      isFirefox: /Firefox/.test(navigator.userAgent),
      isChrome: /Chrome/.test(navigator.userAgent),
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      isEdge: /Edg/.test(navigator.userAgent)
    }
    setDebugInfo(info)
    
    // Check microphone permission
    checkMicrophonePermission()
  }, [])
  
  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setMicPermission(result.state)
      } else {
        setMicPermission('unknown')
      }
    } catch (error) {
      console.warn('Could not check microphone permission:', error)
      setMicPermission('unknown')
    }
  }
  
  const testMicrophoneAccess = async () => {
    try {
      addTestResult('Testing microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      addTestResult('✅ Microphone access granted')
      stream.getTracks().forEach(track => track.stop())
      setMicPermission('granted')
      toast.success('Microphone test successful!')
    } catch (error: any) {
      addTestResult(`❌ Microphone access failed: ${error.name} - ${error.message}`)
      toast.error('Microphone test failed')
    }
  }
  
  const testSpeechRecognition = async () => {
    try {
      addTestResult('Testing speech recognition API...')
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        addTestResult('❌ SpeechRecognition API not available')
        return
      }
      
      const recognition = new SpeechRecognition()
      addTestResult('✅ SpeechRecognition instance created')
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onstart = () => addTestResult('✅ Recognition started')
      recognition.onend = () => addTestResult('✅ Recognition ended')
      recognition.onerror = (event) => addTestResult(`❌ Recognition error: ${event.error}`)
      recognition.onresult = (event) => {
        const result = event.results[0][0]
        addTestResult(`✅ Recognition result: "${result.transcript}" (confidence: ${result.confidence})`)
      }
      
      recognition.start()
      
      // Stop after 3 seconds
      setTimeout(() => {
        recognition.stop()
      }, 3000)
      
    } catch (error: any) {
      addTestResult(`❌ Speech recognition test failed: ${error.message}`)
    }
  }
  
  const clearResults = () => {
    setTestResults([])
    resetTranscript()
  }
  
  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }
  
  const getPermissionIcon = (permission: PermissionState | 'unknown') => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'prompt':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Recognition Debugger
          </CardTitle>
          <CardDescription>
            Comprehensive testing and debugging for speech recognition functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Support Status */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Browser Support Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(browserSupport.hasSpeechRecognition)}
                <span className="text-sm">Speech Recognition API</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(browserSupport.hasMicrophone)}
                <span className="text-sm">Microphone API</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(browserSupport.isHttps)}
                <span className="text-sm">HTTPS/Localhost</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(!browserSupport.isFirefox)}
                <span className="text-sm">Supported Browser</span>
              </div>
              <div className="flex items-center gap-2">
                {getPermissionIcon(micPermission)}
                <span className="text-sm">Microphone Permission: {micPermission}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(isSupported)}
                <span className="text-sm">Overall Support</span>
              </div>
            </div>
          </div>
          
          {/* Current Status */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Status</h3>
            <div className="space-y-2">
              <Badge variant={isListening ? 'default' : 'secondary'}>
                {isListening ? 'Listening' : 'Not Listening'}
              </Badge>
              {error && (
                <Badge variant="destructive">
                  Error: {error}
                </Badge>
              )}
              {transcript && (
                <div className="p-2 bg-muted rounded text-sm">
                  <strong>Final:</strong> {transcript}
                </div>
              )}
              {interimTranscript && (
                <div className="p-2 bg-muted/50 rounded text-sm italic">
                  <strong>Interim:</strong> {interimTranscript}
                </div>
              )}
              {confidence > 0 && (
                <Badge variant="outline">
                  Confidence: {(confidence * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
          
          {/* Test Controls */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Controls</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={testMicrophoneAccess} variant="outline">
                Test Microphone
              </Button>
              <Button onClick={testSpeechRecognition} variant="outline">
                Test Speech API
              </Button>
              <Button onClick={checkMicrophonePermission} variant="outline">
                <RefreshCw className="h-4 w-4 mr-1" />
                Check Permissions
              </Button>
              {!isListening ? (
                <Button onClick={startListening} disabled={!isSupported}>
                  <Mic className="h-4 w-4 mr-1" />
                  Start Listening
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive">
                  <Square className="h-4 w-4 mr-1" />
                  Stop Listening
                </Button>
              )}
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>
          </div>
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Results</h3>
              <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-sm font-mono space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debug Information */}
          <details>
            <summary className="text-lg font-semibold cursor-pointer">Debug Information</summary>
            <div className="mt-3 bg-muted p-3 rounded text-sm font-mono">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
