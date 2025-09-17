import { useState, useEffect, useRef } from 'react'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { Volume2, VolumeX, Play, Pause, Square, Settings, Speaker, AlertCircle, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface VoiceResponseCenterProps {
  className?: string
  responses?: Array<{
    id: string
    text: string
    timestamp: Date
    agentName?: string
  }>
  onClear?: () => void
}

export function VoiceResponseCenter({ className, responses = [], onClear }: VoiceResponseCenterProps) {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  
  const {
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
  } = useTextToSpeech()
  
  const lastResponseRef = useRef<string | null>(null)
  
  // Auto-speak new responses
  useEffect(() => {
    if (autoSpeak && responses.length > 0 && isSupported) {
      const latestResponse = responses[responses.length - 1]
      if (latestResponse && latestResponse.id !== lastResponseRef.current) {
        lastResponseRef.current = latestResponse.id
        // Delay to allow UI to update
        setTimeout(() => {
          speak(latestResponse.text)
          setSelectedResponse(latestResponse.id)
        }, 500)
      }
    }
  }, [responses, autoSpeak, speak, isSupported])
  
  const handleSpeakResponse = (response: { id: string; text: string }) => {
    if (!response.text.trim()) {
      toast.error('No text to speak')
      return
    }
    
    speak(response.text)
    setSelectedResponse(response.id)
  }
  
  const handleStopSpeaking = () => {
    stop()
    setSelectedResponse(null)
  }
  
  const getVoiceDisplayName = (voice: SpeechSynthesisVoice) => {
    return `${voice.name} (${voice.lang})`
  }
  
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className={cn("relative overflow-hidden border-command-accent/30 bg-card/90 backdrop-blur-md", className)}>
      <CommandCenterBackground variant="holographic" color="purple" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl">
          <motion.div
            className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-2xl relative overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            animate={isSpeaking ? {
              boxShadow: ['0 0 20px rgba(168, 85, 247, 0.3)', '0 0 40px rgba(168, 85, 247, 0.8)', '0 0 20px rgba(168, 85, 247, 0.3)']
            } : {}}
          >
            <Volume2 className="h-6 w-6 text-white relative z-10" />
          </motion.div>
          <div className="flex-1">
            <span className="command-title">AI Voice Response Center</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                <Speaker className="h-3 w-3 mr-1" />
                Text-to-Speech Engine
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                {responses.length} Responses
              </Badge>
            </div>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Speaker className="h-4 w-4 text-purple-400" />
          Advanced neural speech synthesis with real-time voice output
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Browser Compatibility Check */}
        {!isSupported && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Text-to-Speech Not Supported</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please use Chrome, Edge, or Safari for voice functionality.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Voice Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!isSpeaking ? (
              <Button
                onClick={() => {
                  if (responses.length > 0) {
                    const latestResponse = responses[responses.length - 1]
                    handleSpeakResponse(latestResponse)
                  } else {
                    toast.error('No responses to speak')
                  }
                }}
                disabled={!isSupported || responses.length === 0}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg font-semibold"
              >
                <Play className="h-5 w-5 mr-2" />
                Speak Latest Response
              </Button>
            ) : (
              <div className="flex gap-2">
                {isPaused ? (
                  <Button
                    onClick={resume}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg font-semibold"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={pause}
                    size="lg"
                    variant="outline"
                    className="border-yellow-500/20 hover:bg-yellow-500/10 text-yellow-400"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={handleStopSpeaking}
                  size="lg"
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg font-semibold"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="border-purple-500/20 hover:bg-purple-500/10 text-purple-400"
            >
              <Settings className="h-4 w-4 mr-2" />
              Voice Settings
            </Button>
            
            {responses.length > 0 && onClear && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="border-red-500/20 hover:bg-red-500/10 text-red-400"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        {/* Voice Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20"
            >
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Voice Configuration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice Selection</label>
                  <Select
                    value={currentVoice?.name || ''}
                    onValueChange={(value) => {
                      const voice = voices.find(v => v.name === value)
                      setCurrentVoice(voice || null)
                    }}
                  >
                    <SelectTrigger className="bg-card/50">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {getVoiceDisplayName(voice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Speech Rate</span>
                      <span className="text-xs text-muted-foreground">{rate.toFixed(1)}x</span>
                    </label>
                    <Slider
                      value={[rate]}
                      onValueChange={([value]) => setRate(value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Volume</span>
                      <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
                    </label>
                    <Slider
                      value={[volume]}
                      onValueChange={([value]) => setVolume(value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentVoice) {
                      speak('This is a test of the neural voice synthesis system. Voice configuration successful.', {
                        voice: currentVoice,
                        rate,
                        pitch,
                        volume
                      })
                    }
                  }}
                  disabled={!isSupported || !currentVoice}
                  className="border-green-500/20 hover:bg-green-500/10 text-green-400"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Test Voice
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Response History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              AI Response History
            </h4>
            {isSpeaking && selectedResponse && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse">
                <Volume2 className="h-3 w-3 mr-1" />
                Speaking...
              </Badge>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            <AnimatePresence>
              {responses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-muted/20 rounded-lg text-center text-muted-foreground"
                >
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No AI responses yet. Submit a task to get started!</p>
                </motion.div>
              ) : (
                responses.map((response, index) => (
                  <motion.div
                    key={response.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 bg-card/30 rounded-lg border transition-colors",
                      selectedResponse === response.id && isSpeaking
                        ? "border-purple-500/40 bg-purple-500/10"
                        : "border-border/50 hover:border-purple-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {response.agentName && (
                            <Badge variant="secondary" className="text-xs">
                              {response.agentName}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(response.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed break-words">
                          {response.text}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeakResponse(response)}
                        disabled={!isSupported || (isSpeaking && selectedResponse === response.id)}
                        className="shrink-0 hover:bg-purple-500/10 hover:text-purple-400"
                      >
                        {selectedResponse === response.id && isSpeaking ? (
                          <Volume2 className="h-4 w-4 text-purple-400" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}