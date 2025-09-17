import { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

interface TextToSpeechOptions {
  voice?: SpeechSynthesisVoice | null
  rate?: number
  pitch?: number
  volume?: number
}

interface UseTextToSpeechReturn {
  speak: (text: string, options?: TextToSpeechOptions) => void
  stop: () => void
  pause: () => void
  resume: () => void
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  voices: SpeechSynthesisVoice[]
  currentVoice: SpeechSynthesisVoice | null
  setCurrentVoice: (voice: SpeechSynthesisVoice | null) => void
  rate: number
  setRate: (rate: number) => void
  pitch: number
  setPitch: (pitch: number) => void
  volume: number
  setVolume: (volume: number) => void
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  useEffect(() => {
    // Check for speech synthesis support
    const supported = 'speechSynthesis' in window
    setIsSupported(supported)
    
    if (!supported) {
      console.warn('Speech synthesis not supported in this browser')
      return
    }
    
    // Load available voices
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)
      
      // Set default voice (prefer English voices)
      if (availableVoices.length > 0 && !currentVoice) {
        const englishVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en-') && voice.localService
        ) || availableVoices.find(voice => 
          voice.lang.startsWith('en-')
        ) || availableVoices[0]
        
        setCurrentVoice(englishVoice)
      }
    }
    
    // Load voices immediately and on voiceschanged event
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      if (utteranceRef.current) {
        speechSynthesis.cancel()
      }
    }
  }, [])
  
  const speak = useCallback((text: string, options?: TextToSpeechOptions) => {
    if (!isSupported) {
      toast.error('Text-to-speech not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }
    
    if (!text.trim()) {
      toast.error('No text to speak')
      return
    }
    
    // Cancel any existing speech
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance
    
    // Apply settings
    utterance.voice = options?.voice || currentVoice
    utterance.rate = options?.rate || rate
    utterance.pitch = options?.pitch || pitch
    utterance.volume = options?.volume || volume
    
    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }
    
    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
      
      let errorMessage = 'Text-to-speech error: '
      switch (event.error) {
        case 'not-allowed':
          errorMessage += 'Permission denied for speech synthesis'
          break
        case 'network':
          errorMessage += 'Network error during speech synthesis'
          break
        case 'synthesis-failed':
          errorMessage += 'Speech synthesis failed'
          break
        default:
          errorMessage += event.error
      }
      
      toast.error(errorMessage)
    }
    
    utterance.onpause = () => {
      setIsPaused(true)
    }
    
    utterance.onresume = () => {
      setIsPaused(false)
    }
    
    // Start speaking
    try {
      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Failed to start speech synthesis:', error)
      toast.error('Failed to start text-to-speech')
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }, [isSupported, currentVoice, rate, pitch, volume])
  
  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
    }
  }, [isSupported])
  
  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isSupported, isSpeaking, isPaused])
  
  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused) {
      speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [isSupported, isSpeaking, isPaused])
  
  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentVoice,
    setCurrentVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume
  }
}