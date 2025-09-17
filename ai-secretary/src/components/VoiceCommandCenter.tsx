import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { Mic, Square, Brain, Send, Activity, AlertCircle, Volume2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Simplified Speech Recognition interface
interface SimpleSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SimpleSpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SimpleSpeechRecognition, ev: any) => any) | null
  onerror: ((this: SimpleSpeechRecognition, ev: any) => any) | null
  onend: ((this: SimpleSpeechRecognition, ev: Event) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SimpleSpeechRecognition
    }
    webkitSpeechRecognition: {
      new(): SimpleSpeechRecognition
    }
  }
}

interface VoiceCommandCenterProps {
  className?: string
  onTaskSubmit?: (content: string, transcription?: string) => Promise<void> | void
  isSubmitting?: boolean
}

export function VoiceCommandCenter({ className, onTaskSubmit, isSubmitting = false }: VoiceCommandCenterProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [interimText, setInterimText] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [isSupported, setIsSupported] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  const recognitionRef = useRef<SimpleSpeechRecognition | null>(null)
  const isStartingRef = useRef(false)
  
  // Initialize speech recognition on component mount
  useEffect(() => {
    initializeSpeechRecognition()
    return cleanup
  }, [])
  
  const initializeSpeechRecognition = useCallback(async () => {
    try {
      console.log('Initializing speech recognition...')
      setErrorMessage('')
      
      // Check for basic browser support
      if (typeof window === 'undefined') {
        console.warn('Window not available')
        return
      }
      
      // Check for Firefox (not supported)
      if (navigator.userAgent.includes('Firefox')) {
        setErrorMessage('Firefox does not support Web Speech API. Please use Chrome, Edge, or Safari.')
        setIsSupported(false)
        setIsInitialized(true)
        return
      }
      
      // Check for HTTPS requirement
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setErrorMessage('Voice recognition requires HTTPS. Please use a secure connection.')
        setIsSupported(false)
        setIsInitialized(true)
        return
      }
      
      // Check for Speech Recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setErrorMessage('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.')
        setIsSupported(false)
        setIsInitialized(true)
        return
      }
      
      // Check for microphone access
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage('Microphone access not available. Please check your browser settings.')
        setIsSupported(false)
        setIsInitialized(true)
        return
      }
      
      // Test microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        setPermissionGranted(true)
        console.log('Microphone permission granted')
      } catch (error: any) {
        console.warn('Microphone permission check failed:', error)
        if (error.name === 'NotAllowedError') {
          setPermissionGranted(false)
          setErrorMessage('Microphone access denied. Please allow microphone access and refresh the page.')
        } else {
          setPermissionGranted(null)
          console.log('Microphone permission status unknown, will request when needed')
        }
      }
      
      // Test creating recognition instance
      try {
        const testRecognition = new SpeechRecognition()
        testRecognition.abort()
        setIsSupported(true)
        console.log('Speech recognition supported')
      } catch (error) {
        console.error('Failed to create speech recognition instance:', error)
        setErrorMessage('Failed to initialize speech recognition. Please refresh the page.')
        setIsSupported(false)
      }
      
    } catch (error) {
      console.error('Error during speech recognition initialization:', error)
      setErrorMessage('Failed to initialize voice recognition. Please refresh the page.')
      setIsSupported(false)
    } finally {
      setIsInitialized(true)
    }
  }, [])
  
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
      recognitionRef.current = null
    }
  }, [])
  
  const startVoiceRecognition = useCallback(async () => {
    if (!isSupported || isStartingRef.current || isRecording) {
      console.log('Cannot start:', { isSupported, isStarting: isStartingRef.current, isRecording })
      return
    }
    
    isStartingRef.current = true
    setErrorMessage('')
    
    try {
      // Request microphone permission if not already granted
      if (permissionGranted !== true) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          })
          stream.getTracks().forEach(track => track.stop())
          setPermissionGranted(true)
        } catch (error: any) {
          console.error('Microphone permission denied:', error)
          setPermissionGranted(false)
          
          if (error.name === 'NotAllowedError') {
            setErrorMessage('Microphone access denied. Please allow microphone access in your browser.')
            toast.error('Please allow microphone access and try again')
          } else {
            setErrorMessage('Microphone not available. Please check your microphone connection.')
            toast.error('Microphone error: ' + error.message)
          }
          return
        }
      }
      
      // Create new recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      
      // Configure recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started')
        setIsRecording(true)
        setTranscription('')
        setInterimText('')
        setConfidence(0)
        toast.success('🎤 Voice recognition started - speak now!')
      }
      
      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          
          if (result.isFinal) {
            finalTranscript += transcript + ' '
            setConfidence(result[0].confidence || 0)
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setTranscription(prev => prev + finalTranscript)
        }
        setInterimText(interimTranscript)
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        
        switch (event.error) {
          case 'not-allowed':
            setErrorMessage('Microphone access denied. Please allow microphone access.')
            setPermissionGranted(false)
            toast.error('Microphone access denied')
            break
          case 'no-speech':
            console.log('No speech detected, continuing...')
            return // Don't stop recording for no-speech
          case 'audio-capture':
            setErrorMessage('Microphone not working. Please check your microphone.')
            toast.error('Microphone not working')
            break
          case 'network':
            setErrorMessage('Network error. Please check your internet connection.')
            toast.error('Network error during speech recognition')
            break
          default:
            setErrorMessage(`Speech recognition error: ${event.error}`)
            toast.error(`Speech recognition error: ${event.error}`)
        }
        
        setIsRecording(false)
      }
      
      recognition.onend = () => {
        console.log('Speech recognition ended')
        setIsRecording(false)
        
        if (transcription.trim() || interimText.trim()) {
          toast.success('✅ Voice recognition completed!')
        }
      }
      
      // Start recognition
      recognition.start()
      console.log('Starting speech recognition...')
      
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      setErrorMessage('Failed to start voice recognition: ' + error.message)
      setIsRecording(false)
      toast.error('Failed to start voice recognition')
    } finally {
      isStartingRef.current = false
    }
  }, [isSupported, isRecording, permissionGranted, transcription, interimText])
  
  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop()
        toast.success('🛑 Voice recognition stopped')
      } catch (error) {
        console.error('Error stopping recognition:', error)
      }
    }
  }, [isRecording])
  
  const submitVoiceTask = useCallback(async () => {
    const finalText = transcription.trim()
    if (!finalText) {
      toast.error('No voice input to submit. Please speak first.')
      return
    }
    
    if (onTaskSubmit) {
      try {
        await onTaskSubmit(finalText, finalText)
        // Reset after successful submission
        setTranscription('')
        setInterimText('')
        setConfidence(0)
        toast.success('🚀 Voice command submitted successfully!')
      } catch (error) {
        console.error('Voice task submission failed:', error)
        toast.error('Failed to submit voice command')
      }
    }
  }, [transcription, onTaskSubmit])
  
  const clearRecording = useCallback(() => {
    cleanup()
    setTranscription('')
    setInterimText('')
    setConfidence(0)
    setIsRecording(false)
    toast.success('🗑️ Recording cleared')
  }, [cleanup])
  
  const retryInitialization = useCallback(() => {
    setIsInitialized(false)
    setErrorMessage('')
    setIsSupported(false)
    setPermissionGranted(null)
    initializeSpeechRecognition()
  }, [initializeSpeechRecognition])
  
  const currentText = transcription + (interimText ? ` ${interimText}` : '')
  
  if (!isInitialized) {
    return (
      <Card className={cn("relative overflow-hidden border-command-accent/30 bg-card/90 backdrop-blur-md", className)}>
        <CommandCenterBackground variant="holographic" color="command" />
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-command-accent border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-sm text-muted-foreground">Initializing voice recognition...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
            <span className="command-title">Voice Command Center</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${
                isSupported 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                <Activity className="h-3 w-3 mr-1" />
                {isSupported ? 'Ready' : 'Not Available'}
              </Badge>
              {permissionGranted === true && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Mic Access
                </Badge>
              )}
            </div>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-command-accent" />
          Real-time speech-to-text with browser Web Speech API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Error Messages */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Voice Recognition Error</p>
                <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
                <Button
                  onClick={retryInitialization}
                  size="sm"
                  variant="outline"
                  className="mt-2 border-red-500/20 hover:bg-red-500/10"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Permission Status */}
        {permissionGranted === false && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Microphone Access Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please allow microphone access when prompted, or check your browser settings.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Recording Status */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gradient-to-r from-command-accent/10 to-command-success/10 rounded-lg border border-command-accent/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic className="h-5 w-5 text-command-accent" />
                </motion.div>
                <span className="text-sm font-medium">🎤 LISTENING - Speak clearly</span>
                <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-400 border-green-500/20">
                  <Activity className="h-3 w-3 mr-1" />
                  ACTIVE
                </Badge>
              </div>
              
              {/* Visual Audio Bars */}
              <div className="flex items-center justify-center gap-1 h-8 mb-3">
                {Array.from({ length: 12 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 bg-gradient-to-t from-command-accent to-command-success rounded-full"
                    animate={{
                      height: isRecording 
                        ? `${Math.max(4, 20 + Math.sin(Date.now() / 200 + i) * 12)}px`
                        : '4px'
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Voice Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={startVoiceRecognition}
                disabled={!isSupported || permissionGranted === false || isSubmitting}
                size="lg"
                className="bg-gradient-to-r from-command-accent to-command-success hover:from-command-accent/80 hover:to-command-success/80 text-white shadow-lg font-semibold disabled:opacity-50"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Voice Input
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
                Stop Recording
              </Button>
            </motion.div>
          )}
        </div>
        
        {/* Transcription Results */}
        <AnimatePresence>
          {(currentText || isRecording) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Speech Recognition Result</span>
                {confidence > 0 && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    {(confidence * 100).toFixed(0)}% confidence
                  </Badge>
                )}
              </div>
              
              <div className="p-3 bg-card/50 rounded border border-border/50 mb-4 min-h-[80px]">
                <p className="text-sm leading-relaxed">
                  {transcription && (
                    <span className="text-foreground">{transcription}</span>
                  )}
                  {interimText && (
                    <span className="text-muted-foreground italic"> {interimText}</span>
                  )}
                  {!currentText && (
                    <span className="text-muted-foreground italic">
                      {isRecording ? 'Listening for speech...' : 'No speech detected yet'}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={submitVoiceTask}
                  disabled={!transcription.trim() || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Voice Command
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
