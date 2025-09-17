import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Mic, Square, Send, AlertCircle, CheckCircle, Volume2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SimpleVoiceInputProps {
  className?: string
  onSubmit?: (text: string) => Promise<void> | void
  isSubmitting?: boolean
  placeholder?: string
}

export function SimpleVoiceInput({ 
  className, 
  onSubmit, 
  isSubmitting = false, 
  placeholder = "Type your message or use voice input..." 
}: SimpleVoiceInputProps) {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Initialize on mount
  useEffect(() => {
    checkSupport()
  }, [])
  
  const checkSupport = useCallback(() => {
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        console.log('Speech recognition not supported')
        setIsSupported(false)
        return
      }
      
      // Check for Firefox
      if (navigator.userAgent.includes('Firefox')) {
        console.log('Firefox does not support Web Speech API')
        setIsSupported(false)
        return
      }
      
      // Check protocol
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.log('HTTPS required for speech recognition')
        setIsSupported(false)
        return
      }
      
      // Check microphone support
      if (!navigator.mediaDevices?.getUserMedia) {
        console.log('Microphone not supported')
        setIsSupported(false)
        return
      }
      
      setIsSupported(true)
      console.log('Speech recognition supported')
      
    } catch (error) {
      console.error('Error checking speech support:', error)
      setIsSupported(false)
    }
  }, [])
  
  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) return
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setPermissionGranted(true)
      
      // Create recognition instance
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognitionRef.current = recognition
      
      // Configure
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      // Event handlers
      recognition.onstart = () => {
        setIsRecording(true)
        setCurrentTranscript('')
        toast.success('🎤 Recording started - speak now!')
      }
      
      recognition.onresult = (event: any) => {
        let finalText = ''
        let interimText = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalText += transcript + ' '
          } else {
            interimText += transcript
          }
        }
        
        if (finalText) {
          setText(prev => prev + finalText)
        }
        
        setCurrentTranscript(interimText)
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        
        switch (event.error) {
          case 'not-allowed':
            toast.error('Microphone access denied')
            setPermissionGranted(false)
            break
          case 'no-speech':
            // Don't show error for no speech, just continue
            break
          case 'audio-capture':
            toast.error('Microphone not working')
            break
          case 'network':
            toast.error('Network error')
            break
          default:
            toast.error(`Speech recognition error: ${event.error}`)
        }
        
        if (event.error !== 'no-speech') {
          setIsRecording(false)
        }
      }
      
      recognition.onend = () => {
        setIsRecording(false)
        setCurrentTranscript('')
        if (text.trim()) {
          toast.success('✅ Recording completed!')
        }
      }
      
      // Start recognition
      recognition.start()
      
    } catch (error: any) {
      console.error('Error starting recording:', error)
      
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow access and try again.')
        setPermissionGranted(false)
      } else {
        toast.error('Failed to start recording')
      }
    }
  }, [isSupported, isRecording, text])
  
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      toast.success('🛑 Recording stopped')
    }
  }, [isRecording])
  
  const handleSubmit = useCallback(async () => {
    const finalText = text.trim()
    if (!finalText) {
      toast.error('Please enter some text or use voice input')
      return
    }
    
    if (onSubmit) {
      try {
        console.log('Submitting voice/text input:', {
          text: finalText.substring(0, 100) + '...',
          length: finalText.length
        })
        
        await onSubmit(finalText)
        setText('')
        setCurrentTranscript('')
        console.log('Voice/text submission successful')
        toast.success('🚀 Task submitted successfully!')
      } catch (error: any) {
        console.error('Submit error:', error)
        toast.error(`Failed to submit: ${error.message || 'Unknown error'}`)
      }
    }
  }, [text, onSubmit])
  
  const clearText = useCallback(() => {
    setText('')
    setCurrentTranscript('')
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    setIsRecording(false)
    toast.success('🗑️ Text cleared')
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])
  
  const displayText = text + (currentTranscript ? ` ${currentTranscript}` : '')
  
  return (
    <Card className={cn("relative overflow-hidden bg-card/90 backdrop-blur-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <span>Voice & Text Input</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${
                isSupported 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {isSupported ? (
                  <><CheckCircle className="h-3 w-3 mr-1" />Voice Ready</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" />Voice Unavailable</>
                )}
              </Badge>
              {permissionGranted && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Mic Access
                </Badge>
              )}
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Type your message or use voice input for hands-free AI task creation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Voice not supported message */}
        {!isSupported && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Voice input not available</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {navigator.userAgent.includes('Firefox') 
                ? 'Firefox does not support voice input. Please use Chrome, Edge, or Safari.'
                : 'Voice input requires Chrome, Edge, or Safari on HTTPS.'
              }
            </p>
          </div>
        )}
        
        {/* Permission denied message */}
        {permissionGranted === false && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Microphone access denied</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Please allow microphone access in your browser and try again.
            </p>
          </div>
        )}
        
        {/* Recording indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic className="h-4 w-4 text-blue-500" />
                </motion.div>
                <span className="text-sm font-medium">🎤 Recording... Speak clearly</span>
                <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>
              </div>
              
              {/* Audio visualization */}
              <div className="flex items-center justify-center gap-1 h-6 mt-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                    animate={{
                      height: isRecording 
                        ? `${Math.max(4, 16 + Math.sin(Date.now() / 150 + i) * 8)}px`
                        : '4px'
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Text input area */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={displayText}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
          {currentTranscript && (
            <p className="text-xs text-muted-foreground italic">
              Speaking: "{currentTranscript}"
            </p>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex gap-2">
          {/* Voice controls */}
          {isSupported && (
            <>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  variant="outline"
                  disabled={permissionGranted === false || isSubmitting}
                  className="border-blue-500/20 hover:bg-blue-500/10"
                >
                  <Mic className="h-4 w-4 mr-1" />
                  Voice
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="border-red-500/20 hover:bg-red-500/10 text-red-500"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}
            </>
          )}
          
          {/* Text controls */}
          <Button
            onClick={clearText}
            variant="outline"
            disabled={!text.trim() || isSubmitting}
          >
            Clear
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
                Submit
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
