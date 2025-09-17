import { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError,
    onStart,
    onEnd
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const isStartingRef = useRef(false)

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      try {
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
        
        if (!SpeechRecognition) {
          setError('Speech recognition not supported in this browser')
          return false
        }

        // Check for Firefox
        if (navigator.userAgent.includes('Firefox')) {
          setError('Firefox does not support Web Speech API')
          return false
        }

        // Check for HTTPS (except localhost)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          setError('Speech recognition requires HTTPS')
          return false
        }

        // Check microphone availability
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Microphone access not available')
          return false
        }

        return true
      } catch (err) {
        setError('Error checking speech recognition support')
        return false
      }
    }

    const supported = checkSupport()
    setIsSupported(supported)
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported || isStartingRef.current || isListening) {
      return
    }

    isStartingRef.current = true
    setError(null)

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognitionRef.current = recognition
      
      // Configure recognition
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = language
      
      // Event handlers
      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        setInterimTranscript('')
        setConfidence(0)
        onStart?.()
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interim = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript
          const conf = result[0].confidence || 0
          
          if (result.isFinal) {
            finalTranscript += text
            setConfidence(conf)
            
            // Call callback with final result
            onResult?.({
              transcript: text,
              confidence: conf,
              isFinal: true
            })
          } else {
            interim += text
            
            // Call callback with interim result
            onResult?.({
              transcript: text,
              confidence: conf,
              isFinal: false
            })
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
        setInterimTranscript(interim)
      }
      
      recognition.onerror = (event: any) => {
        const errorMessage = `Speech recognition error: ${event.error}`
        setError(errorMessage)
        onError?.(errorMessage)
        
        if (event.error !== 'no-speech') {
          setIsListening(false)
        }
      }
      
      recognition.onend = () => {
        setIsListening(false)
        onEnd?.()
      }
      
      // Start recognition
      recognition.start()
      
    } catch (err: any) {
      const errorMessage = `Failed to start speech recognition: ${err.message}`
      setError(errorMessage)
      onError?.(errorMessage)
      setIsListening(false)
    } finally {
      isStartingRef.current = false
    }
  }, [isSupported, isListening, continuous, interimResults, language, onResult, onError, onStart, onEnd])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupport: {
      hasSpeechRecognition: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
      isFirefox: navigator.userAgent.includes('Firefox'),
      isHttps: location.protocol === 'https:' || location.hostname === 'localhost',
      hasMicrophone: !!(navigator.mediaDevices?.getUserMedia)
    }
  }
}
