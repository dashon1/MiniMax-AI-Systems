import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { Mic, Square, Brain, Send, Activity, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  // Optional properties that may not be available on all browsers
  maxAlternatives?: number
  onspeechstart?: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend?: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundstart?: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend?: ((this: SpeechRecognition, ev: Event) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new(): SpeechRecognition
    }
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionError extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface VoiceCommandCenterProps {
  className?: string
  onTaskSubmit?: (content: string, transcription?: string) => Promise<void> | void
  isSubmitting?: boolean
}

export function VoiceCommandCenter({ className, onTaskSubmit, isSubmitting = false }: VoiceCommandCenterProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  useEffect(() => {
    // Enhanced speech recognition support detection
    const checkSpeechRecognition = () => {
      try {
        // Check multiple ways to detect speech recognition support
        const hasWebSpeechAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
        const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        
        // Additional browser-specific checks
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        const isEdge = /Edg/.test(navigator.userAgent)
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
        const isFirefox = /Firefox/.test(navigator.userAgent)
        
        // Firefox doesn't support Web Speech API
        if (isFirefox) {
          console.warn('Firefox does not support Web Speech API')
          return false
        }
        
        // Check if we can create a SpeechRecognition instance
        let canCreateRecognition = false
        try {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
          if (SpeechRecognition) {
            const testRecognition = new SpeechRecognition()
            canCreateRecognition = !!testRecognition
            // Clean up test instance
            if (testRecognition && testRecognition.abort) {
              testRecognition.abort()
            }
          }
        } catch (error) {
          console.warn('Cannot create SpeechRecognition instance:', error)
          canCreateRecognition = false
        }
        
        return hasWebSpeechAPI && hasGetUserMedia && canCreateRecognition && (isChrome || isEdge || isSafari)
      } catch (error) {
        console.error('Error checking speech recognition support:', error)
        return false
      }
    }
    
    const isSupported = checkSpeechRecognition()
    setSupportsSpeechRecognition(isSupported)
    
    // Enhanced microphone permission checking
    const checkMicrophonePermissions = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
          
          result.onchange = () => {
            setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
          }
        } else {
          // Fallback: try to access microphone to check permissions
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setPermissionStatus('granted')
            // Stop the stream immediately as this is just a permission check
            stream.getTracks().forEach(track => track.stop())
          } catch (error: any) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
              setPermissionStatus('denied')
            } else {
              setPermissionStatus('prompt')
            }
          }
        }
      } catch (error) {
        console.warn('Unable to check microphone permissions:', error)
        setPermissionStatus('prompt')
      }
    }
    
    if (isSupported) {
      checkMicrophonePermissions()
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (error) {
          console.warn('Error aborting speech recognition:', error)
        }
      }
    }
  }, [])
  
  const startVoiceRecognition = async () => {
    if (!supportsSpeechRecognition) {
      const isFirefox = /Firefox/.test(navigator.userAgent)
      if (isFirefox) {
        toast.error('Firefox does not support voice recognition. Please use Chrome, Edge, or Safari.')
      } else {
        toast.error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.')
      }
      return
    }

    try {
      // Enhanced microphone permission and access check
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        setPermissionStatus('granted')
        // Stop the stream after permission check
        stream.getTracks().forEach(track => track.stop())
      } catch (permissionError: any) {
        let errorMessage = 'Microphone access failed: '
        
        switch (permissionError.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage += 'Permission denied. Please allow microphone access and try again.'
            setPermissionStatus('denied')
            break
          case 'NotFoundError':
            errorMessage += 'No microphone found. Please check your microphone connection.'
            break
          case 'NotReadableError':
            errorMessage += 'Microphone is being used by another application.'
            break
          default:
            errorMessage += permissionError.message || 'Unknown error accessing microphone.'
        }
        
        toast.error(errorMessage)
        return
      }
      
      // Create speech recognition instance with enhanced error handling
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        toast.error('Speech recognition not available. Please use a supported browser.')
        setSupportsSpeechRecognition(false)
        return
      }
      
      let recognition: SpeechRecognition
      try {
        recognition = new SpeechRecognition()
      } catch (constructorError) {
        console.error('Failed to create SpeechRecognition instance:', constructorError)
        toast.error('Failed to initialize speech recognition. Please refresh the page and try again.')
        return
      }
      
      recognitionRef.current = recognition
      
      // Configure recognition with optimal settings
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      // Set maxAlternatives if supported
      if ('maxAlternatives' in recognition) {
        ;(recognition as any).maxAlternatives = 1
      }
      
      // Enhanced event handlers
      recognition.onstart = () => {
        setIsRecording(true)
        setTranscription('')
        setInterimTranscript('')
        setConfidence(0)
        toast.success('Voice recognition started - Speak clearly!')
      }
      
      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        try {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcript = result[0].transcript
            const confidence = result[0].confidence || 0
            
            if (result.isFinal) {
              finalTranscript += transcript + ' '
              setConfidence(confidence)
            } else {
              interimTranscript += transcript
            }
          }
          
          if (finalTranscript) {
            setTranscription(prev => prev + finalTranscript)
          }
          setInterimTranscript(interimTranscript)
        } catch (resultError) {
          console.error('Error processing speech results:', resultError)
        }
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error, event)
        let errorMessage = 'Speech recognition error: '
        let shouldStopRecording = true
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage += 'Microphone access denied. Please enable microphone permissions in your browser settings.'
            setPermissionStatus('denied')
            break
          case 'no-speech':
            errorMessage += 'No speech detected. Please speak clearly and try again.'
            shouldStopRecording = false // Don't stop for no-speech, let user try again
            break
          case 'audio-capture':
            errorMessage += 'Microphone not found or not working. Please check your microphone.'
            break
          case 'network':
            errorMessage += 'Network error occurred. Please check your internet connection.'
            break
          case 'service-not-allowed':
            errorMessage += 'Speech recognition service not allowed. Please use HTTPS.'
            break
          case 'bad-grammar':
            errorMessage += 'Speech recognition configuration error.'
            break
          case 'language-not-supported':
            errorMessage += 'Language not supported. Switching to default language.'
            break
          default:
            errorMessage += `${event.error}. Please try again.`
        }
        
        toast.error(errorMessage)
        
        if (shouldStopRecording) {
          setIsRecording(false)
        }
      }
      
      recognition.onend = () => {
        setIsRecording(false)
        if (transcription.trim() || interimTranscript.trim()) {
          toast.success('Voice recognition completed!')
        } else {
          toast('Voice recognition ended. Click start to try again.', { icon: 'ℹ️' })
        }
      }
      
      // Set optional event handlers if supported
      if ('onspeechstart' in recognition) {
        ;(recognition as any).onspeechstart = () => {
          console.log('Speech detected')
        }
      }
      
      if ('onspeechend' in recognition) {
        ;(recognition as any).onspeechend = () => {
          console.log('Speech ended')
        }
      }
      
      if ('onsoundstart' in recognition) {
        ;(recognition as any).onsoundstart = () => {
          console.log('Sound detected')
        }
      }
      
      if ('onsoundend' in recognition) {
        ;(recognition as any).onsoundend = () => {
          console.log('Sound ended')
        }
      }
      
      // Start recognition with timeout safety
      try {
        recognition.start()
      } catch (startError) {
        console.error('Failed to start recognition:', startError)
        toast.error('Failed to start voice recognition. Please try again.')
        setIsRecording(false)
      }
      
    } catch (error) {
      console.error('Unexpected error in voice recognition:', error)
      toast.error('An unexpected error occurred. Please refresh the page and try again.')
      setIsRecording(false)
    }
  }
  
  const stopVoiceRecognition = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        setIsRecording(false)
        toast.success('Voice recognition stopped')
      }
    } catch (error) {
      console.error('Error stopping voice recognition:', error)
      setIsRecording(false)
    }
  }
  
  const submitVoiceTask = async () => {
    const finalText = transcription.trim()
    if (finalText && onTaskSubmit) {
      try {
        await onTaskSubmit(finalText, finalText)
        // Reset state after successful submission
        setTranscription('')
        setInterimTranscript('')
        setConfidence(0)
      } catch (error) {
        console.error('Voice task submission failed:', error)
        toast.error('Failed to process voice command')
      }
    } else {
      toast.error('No voice input detected. Please try speaking again.')
    }
  }
  
  const clearRecording = () => {
    setTranscription('')
    setInterimTranscript('')
    setConfidence(0)
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    setIsRecording(false)
    toast.success('Voice session cleared')
  }
  
  const currentTranscript = transcription + (interimTranscript ? ` ${interimTranscript}` : '')

  return (
    <Card className={cn("relative overflow-hidden border-command-accent/30 bg-card/90 backdrop-blur-md", className)}>
      <CommandCenterBackground variant="holographic" color="command" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl">
          <motion.div
            className="p-3 bg-gradient-to-br from-command-accent to-command-success rounded-xl shadow-2xl relative overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            animate={isRecording ? {
              boxShadow: ['0 0 20px rgba(0, 212, 255, 0.3)', '0 0 40px rgba(0, 212, 255, 0.8)', '0 0 20px rgba(0, 212, 255, 0.3)']
            } : {}}
          >
            <Mic className="h-6 w-6 text-white relative z-10" />
          </motion.div>
          <div className="flex-1">
            <span className="command-title">Neural Voice Command Center</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-command-success/10 text-command-success border-command-success/20 text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Real-time Processing
              </Badge>
              <Badge variant="outline" className="bg-command-accent/10 text-command-accent border-command-accent/20 text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI Speech Engine
              </Badge>
            </div>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-command-accent" />
          Advanced voice-to-agent orchestration with native browser speech recognition
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Enhanced Browser Compatibility Check */}
        {!supportsSpeechRecognition && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Voice Recognition Not Available</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  {/Firefox/.test(navigator.userAgent) ? (
                    <p>Firefox does not support the Web Speech API. Please switch to Chrome, Edge, or Safari.</p>
                  ) : (
                    <>
                      <p>Your browser may not support voice recognition or it requires specific conditions:</p>
                      <ul className="list-disc list-inside ml-2 space-y-0.5">
                        <li>Use Chrome, Edge, or Safari browsers</li>
                        <li>Ensure you're using HTTPS (required for microphone access)</li>
                        <li>Check that microphone permissions are enabled</li>
                        <li>Try refreshing the page</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Microphone Access Denied</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please enable microphone permissions in your browser settings and refresh the page.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Voice Recognition Interface */}
        <div className="space-y-4">
          {/* Live Recognition Status */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gradient-to-r from-command-accent/10 to-command-success/10 rounded-lg border border-command-accent/20 holographic-border"
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="h-5 w-5 text-command-accent" />
                  </motion.div>
                  <span className="text-sm font-medium">Neural Speech Recognition - ACTIVE</span>
                  <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-400 border-green-500/20">
                    <Activity className="h-3 w-3 mr-1" />
                    LISTENING
                  </Badge>
                </div>
                
                {/* Speech Visualization */}
                <div className="flex items-center justify-center gap-1 h-12">
                  {Array.from({ length: 16 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-gradient-to-t from-command-accent to-command-success rounded-full"
                      animate={{
                        height: isRecording 
                          ? `${Math.max(4, 30 + Math.sin(Date.now() / 200 + i) * 15)}px`
                          : '4px'
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                </div>
                
                <div className="text-xs text-center text-muted-foreground mt-2">
                  Speak clearly... Neural processing will convert your speech to text automatically
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Voice Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={startVoiceRecognition}
                  disabled={!supportsSpeechRecognition || permissionStatus === 'denied'}
                  size="lg"
                  className="bg-gradient-to-r from-command-accent to-command-success hover:from-command-accent/80 hover:to-command-success/80 text-white shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Voice Recognition
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={stopVoiceRecognition}
                  size="lg"
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg font-semibold"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recognition
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Live Transcription Results */}
        <AnimatePresence>
          {(currentTranscript || isRecording) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20 holographic-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Neural Transcription</span>
                {confidence > 0 && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    {(confidence * 100).toFixed(1)}% confidence
                  </Badge>
                )}
              </div>
              
              <div className="p-3 bg-card/50 rounded border border-border/50 mb-4 min-h-[60px]">
                <p className="text-sm text-foreground leading-relaxed">
                  {currentTranscript || (
                    <span className="text-muted-foreground italic">
                      {isRecording ? 'Listening for your voice...' : 'No speech detected yet'}
                    </span>
                  )}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic"> {interimTranscript}</span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={submitVoiceTask}
                  disabled={!transcription.trim() || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Deploy to Neural Collective
                    </>
                  )}
                </Button>
                <Button
                  onClick={clearRecording}
                  variant="outline"
                  disabled={isSubmitting}
                  className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                >
                  Clear
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}