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
  onTaskSubmit?: (content: string, transcription?: string) => void
}

export function VoiceCommandCenter({ className, onTaskSubmit }: VoiceCommandCenterProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupportsSpeechRecognition(!!SpeechRecognition)
    
    // Check microphone permissions
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
        }
      })
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])
  
  const startVoiceRecognition = async () => {
    if (!supportsSpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        setIsRecording(true)
        setTranscription('')
        setInterimTranscript('')
        toast.success('Voice recognition started - Speak now!')
      }
      
      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const confidence = event.results[i][0].confidence || 0
          
          if (event.results[i].isFinal) {
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
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        let errorMessage = 'Speech recognition error: '
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage += 'Microphone access denied. Please enable microphone permissions.'
            setPermissionStatus('denied')
            break
          case 'no-speech':
            errorMessage += 'No speech detected. Please try speaking again.'
            break
          case 'network':
            errorMessage += 'Network error. Please check your internet connection.'
            break
          case 'audio-capture':
            errorMessage += 'Microphone not found or not working.'
            break
          default:
            errorMessage += event.error
        }
        
        toast.error(errorMessage)
        setIsRecording(false)
      }
      
      recognition.onend = () => {
        setIsRecording(false)
        if (transcription || interimTranscript) {
          toast.success('Voice recognition completed!')
        }
      }
      
      recognition.start()
      
    } catch (error) {
      console.error('Error starting voice recognition:', error)
      toast.error('Failed to access microphone. Please check permissions and try again.')
      setIsRecording(false)
    }
  }
  
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }
  
  const submitVoiceTask = () => {
    const finalText = transcription.trim()
    if (finalText && onTaskSubmit) {
      onTaskSubmit(finalText, finalText)
      toast.success('Voice command deployed to Neural Collective!')
      // Reset state
      setTranscription('')
      setInterimTranscript('')
      setConfidence(0)
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
        {/* Browser Compatibility Check */}
        {!supportsSpeechRecognition && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Speech Recognition Not Supported</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please use Chrome, Edge, or Safari for voice functionality.
                </p>
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
                  disabled={!transcription.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Deploy to Neural Collective
                </Button>
                <Button
                  onClick={clearRecording}
                  variant="outline"
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