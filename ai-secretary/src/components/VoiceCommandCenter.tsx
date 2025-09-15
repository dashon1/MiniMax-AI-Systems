import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { Mic, MicOff, Play, Pause, Square, Volume2, AudioLines, Brain, Zap, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VoiceCommandCenterProps {
  className?: string
  onTaskSubmit?: (content: string, transcription?: string) => void
}

export function VoiceCommandCenter({ className, onTaskSubmit }: VoiceCommandCenterProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  
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
      
      // Audio level monitoring
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
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
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioLevel(0)
        audioContext.close()
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      updateAudioLevel()
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
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
    if (!audioBlob) return
    
    setIsProcessing(true)
    
    // Simulate voice processing and transcription
    setTimeout(() => {
      const mockTranscription = "Create a comprehensive market analysis report for the AI industry in 2025, focusing on emerging trends and competitive landscape."
      setTranscription(mockTranscription)
      setIsProcessing(false)
    }, 2000)
  }
  
  const submitVoiceTask = () => {
    if (transcription && onTaskSubmit) {
      onTaskSubmit(transcription, transcription)
      // Reset state
      setAudioBlob(null)
      setTranscription('')
      setIsPlaying(false)
    }
  }
  
  const clearRecording = () => {
    setAudioBlob(null)
    setTranscription('')
    setIsPlaying(false)
    setAudioLevel(0)
  }

  return (
    <Card className={cn("relative overflow-hidden border-command-accent/30 bg-card/80 backdrop-blur-md", className)}>
      <CommandCenterBackground variant="holographic" color="command" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl">
          <motion.div
            className="p-2 bg-gradient-to-br from-command-accent to-command-success rounded-lg shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Mic className="h-5 w-5 text-white" />
          </motion.div>
          <span className="command-title">Voice Command Center</span>
          <Badge variant="outline" className="bg-command-success/10 text-command-success border-command-success/20">
            Neural Voice Processing
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Advanced voice-to-agent orchestration with real-time neural processing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Voice Recording Interface */}
        <div className="space-y-4">
          {/* Audio Level Visualizer */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gradient-to-r from-command-accent/10 to-command-success/10 rounded-lg border border-command-accent/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <AudioLines className="h-5 w-5 text-command-accent" />
                  <span className="text-sm font-medium">Neural Audio Analysis</span>
                  <Badge variant="outline" className="animate-pulse bg-red-500/10 text-red-400 border-red-500/20">
                    RECORDING
                  </Badge>
                </div>
                
                {/* Audio visualizer bars */}
                <div className="flex items-center justify-center gap-1 h-16">
                  {Array.from({ length: 20 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-gradient-to-t from-command-accent to-command-success rounded-full"
                      animate={{
                        height: isRecording 
                          ? `${Math.max(4, (audioLevel / 255) * 60 + Math.random() * 20)}px`
                          : '4px'
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
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
                  className="bg-gradient-to-r from-command-accent to-command-success hover:from-command-accent/80 hover:to-command-success/80 text-white shadow-lg"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Voice Command
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Audio Playback Controls */}
        <AnimatePresence>
          {audioBlob && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">Voice Recording Ready</span>
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
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Brain className="h-4 w-4" />
                    </motion.div>
                    Neural Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Process Voice Command
                  </div>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Transcription Results */}
        <AnimatePresence>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Neural Transcription Complete</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  Ready for Agent Processing
                </Badge>
              </div>
              
              <div className="p-3 bg-card/50 rounded border border-border/50 mb-4">
                <p className="text-sm text-foreground">{transcription}</p>
              </div>
              
              <Button
                onClick={submitVoiceTask}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit to Super Agent Group
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}