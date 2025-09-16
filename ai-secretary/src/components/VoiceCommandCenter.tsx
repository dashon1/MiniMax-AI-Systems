import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { Mic, MicOff, Play, Pause, Square, Volume2, AudioLines, Brain, Zap, Send, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface VoiceCommandCenterProps {
  className?: string
  onTaskSubmit?: (content: string, transcription?: string) => void
}

export function VoiceCommandCenter({ className, onTaskSubmit }: VoiceCommandCenterProps) {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [processingStats, setProcessingStats] = useState<{confidence: number, suggestedAgent: string, processingTime: number} | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Real audio level monitoring
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        setAudioLevel(average)
        
        if (isRecording) {
          animationRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(blob)
        setAudioLevel(0)
        audioContext.close()
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      updateAudioLevel()
      toast.success('Voice recording started - Neural processing active')
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Failed to access microphone. Please check permissions.')
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      toast.success('Voice recording completed - Ready for neural processing')
    }
  }
  
  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      setIsPlaying(true)
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    }
  }
  
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }
  
  const processVoiceCommand = async () => {
    if (!audioBlob || !user) {
      toast.error('Please record audio and ensure you are authenticated')
      return
    }
    
    setIsProcessing(true)
    toast.loading('Neural voice processing initiated...', { id: 'voice-processing' })
    
    try {
      // Convert audio blob to base64 for transmission
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        
        // Call the production voice processing edge function
        const { data, error } = await supabase.functions.invoke('voice-processing-engine', {
          body: {
            audioBlob: base64Audio,
            userId: user.id,
            sessionId: `voice-${Date.now()}`
          }
        })
        
        if (error) {
          throw error
        }
        
        const response = data.data
        setTranscription(response.transcription)
        setProcessingStats({
          confidence: response.confidence,
          suggestedAgent: response.suggestedAgent,
          processingTime: response.processingTime
        })
        
        toast.success(`Voice processed successfully! Confidence: ${(response.confidence * 100).toFixed(1)}%`, { id: 'voice-processing' })
        setIsProcessing(false)
      }
    } catch (error: any) {
      console.error('Voice processing error:', error)
      toast.error(`Neural processing failed: ${error.message}`, { id: 'voice-processing' })
      setIsProcessing(false)
    }
  }
  
  const submitVoiceTask = () => {
    if (transcription && onTaskSubmit) {
      onTaskSubmit(transcription, transcription)
      toast.success('Voice command deployed to Super Agent Group!')
      // Reset state
      setAudioBlob(null)
      setTranscription('')
      setIsPlaying(false)
      setProcessingStats(null)
    }
  }
  
  const clearRecording = () => {
    setAudioBlob(null)
    setTranscription('')
    setIsPlaying(false)
    setAudioLevel(0)
    setProcessingStats(null)
    toast.success('Voice session cleared')
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
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-xl"
              animate={{
                opacity: [0, 0.5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
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
          Advanced voice-to-agent orchestration with production-grade neural processing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Voice Recording Interface */}
        <div className="space-y-4">
          {/* Real-time Audio Level Visualizer */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gradient-to-r from-command-accent/10 to-command-success/10 rounded-lg border border-command-accent/20 holographic-border"
              >
                <div className="flex items-center gap-3 mb-3">
                  <AudioLines className="h-5 w-5 text-command-accent" />
                  <span className="text-sm font-medium">Neural Audio Analysis - LIVE</span>
                  <Badge variant="outline" className="animate-pulse bg-red-500/10 text-red-400 border-red-500/20">
                    <Activity className="h-3 w-3 mr-1" />
                    RECORDING
                  </Badge>
                </div>
                
                {/* Real-time audio visualizer bars */}
                <div className="flex items-center justify-center gap-1 h-16">
                  {Array.from({ length: 24 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-command-accent via-command-success to-command-accent rounded-full"
                      animate={{
                        height: isRecording 
                          ? `${Math.max(4, (audioLevel / 255) * 60 + Math.random() * 20 + Math.sin(Date.now() / 100 + i) * 10)}px`
                          : '4px'
                      }}
                      transition={{ duration: 0.05 }}
                    />
                  ))}
                </div>
                
                <div className="text-xs text-center text-muted-foreground mt-2">
                  Audio Level: {Math.round((audioLevel / 255) * 100)}% | Duration: {Math.floor((Date.now() - (Date.now() % 60000)) / 1000)}s
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-gradient-to-r from-command-accent to-command-success hover:from-command-accent/80 hover:to-command-success/80 text-white shadow-lg font-semibold"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Neural Voice Capture
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg font-semibold"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop & Finalize Recording
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Audio Playback & Processing */}
        <AnimatePresence>
          {audioBlob && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20 holographic-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">Voice Recording Captured</span>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                    Ready for Neural Processing
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isPlaying ? pauseAudio : playAudio}
                    className="border-purple-500/20 hover:bg-purple-500/10"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearRecording}
                    className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={processVoiceCommand}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 font-semibold"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Brain className="h-4 w-4" />
                    </motion.div>
                    Neural Processing in Progress...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Engage Neural Voice Processing
                  </div>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Production Transcription Results */}
        <AnimatePresence>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20 holographic-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Neural Transcription Analysis Complete</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  Production Ready
                </Badge>
              </div>
              
              {processingStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-card/30 rounded">
                    <div className="text-lg font-bold text-green-400">{(processingStats.confidence * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center p-2 bg-card/30 rounded">
                    <div className="text-lg font-bold text-command-accent">{processingStats.processingTime}ms</div>
                    <div className="text-xs text-muted-foreground">Processing Time</div>
                  </div>
                  <div className="text-center p-2 bg-card/30 rounded">
                    <div className="text-xs font-bold text-command-success capitalize">
                      {processingStats.suggestedAgent.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">Suggested Collective</div>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-card/50 rounded border border-border/50 mb-4">
                <p className="text-sm text-foreground leading-relaxed">{transcription}</p>
              </div>
              
              <Button
                onClick={submitVoiceTask}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-semibold"
              >
                <Send className="h-4 w-4 mr-2" />
                Deploy to Super Agent Group
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}