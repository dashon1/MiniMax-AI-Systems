import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { X, MessageSquare, Send, User, Bot, Sparkles, Zap, HelpCircle, Mail, Phone, Shield, Activity, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
}

interface CustomerServiceBotProps {
  isOpen: boolean
  onClose: () => void
  onLeadCapture?: (data: { name: string; email: string; company: string; message: string }) => void
}

export function CustomerServiceBot({ isOpen, onClose, onLeadCapture }: CustomerServiceBotProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to the AI Super Agent Group Command Center! I\'m your intelligent assistant, powered by advanced NLP. How can our strongest agent collective help you today?',
      timestamp: new Date(),
      confidence: 1.0
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [sessionId] = useState(`chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [conversationStats, setConversationStats] = useState({ totalMessages: 0, avgConfidence: 0 })

  // Real-time conversation analytics
  useEffect(() => {
    const botMessages = messages.filter(m => m.type === 'bot' && m.confidence)
    const totalMessages = messages.length
    const avgConfidence = botMessages.length > 0 
      ? botMessages.reduce((sum, m) => sum + (m.confidence || 0), 0) / botMessages.length 
      : 0
    
    setConversationStats({ totalMessages, avgConfidence })
  }, [messages])

  const addMessage = (type: 'user' | 'bot', content: string, intent?: string, confidence?: number) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      intent,
      confidence
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    addMessage('user', inputMessage)
    const userMessage = inputMessage
    setInputMessage('')
    setIsTyping(true)

    try {
      // Call the production customer service AI edge function
      const { data, error } = await supabase.functions.invoke('customer-service-ai', {
        body: {
          message: userMessage,
          sessionId,
          userId: user?.id,
          conversationHistory: messages.map(m => ({
            type: m.type,
            content: m.content,
            timestamp: m.timestamp.toISOString()
          })),
          leadData
        }
      })

      if (error) {
        throw error
      }

      const response = data.data
      addMessage('bot', response.response, response.intent, response.confidence)
      
      // Handle special actions
      if (response.leadCaptureForm) {
        setShowLeadForm(true)
      }
      
      if (response.escalateToHuman) {
        toast.info('Escalating to human agent...', { icon: '👥' })
      }
      
      setIsTyping(false)
      
    } catch (error: any) {
      console.error('Customer service error:', error)
      addMessage('bot', 'I apologize, but I\'m experiencing technical difficulties. Our technical collective is working on a solution. Please try again in a moment.', 'error', 0.5)
      setIsTyping(false)
      toast.error('AI service temporarily unavailable')
    }
  }

  const handleLeadSubmit = async () => {
    if (leadData.name && leadData.email) {
      try {
        // Store lead data in Supabase
        const { error } = await supabase
          .from('customer_service_conversations')
          .upsert({
            session_id: sessionId,
            user_id: user?.id,
            lead_data: leadData,
            status: 'lead_captured'
          })
        
        if (error) throw error
        
        onLeadCapture?.(leadData)
        addMessage('bot', `Thank you ${leadData.name}! I've captured your information and our specialist team will reach out within 24 hours. In the meantime, feel free to explore our Super Agent Group capabilities!`)
        setShowLeadForm(false)
        setLeadData({ name: '', email: '', company: '', message: '' })
        toast.success('Contact information captured successfully!')
        
      } catch (error: any) {
        console.error('Lead capture error:', error)
        toast.error('Failed to save contact information')
      }
    }
  }

  const handleQuickAction = (action: string) => {
    const quickActions: Record<string, string> = {
      'agent_capabilities': 'What are the capabilities of your Super Agent Group?',
      'pricing_info': 'Can you tell me about your pricing plans?',
      'demo_request': 'I\'d like to schedule a demo of your platform',
      'technical_support': 'I need technical support with the platform'
    }
    
    if (quickActions[action]) {
      setInputMessage(quickActions[action])
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 right-4 w-96 h-[700px] z-50"
      >
        <Card className="h-full flex flex-col border-command-accent/30 bg-card/95 backdrop-blur-md shadow-2xl">
          <CommandCenterBackground variant="subtle" color="command" />
          
          {/* Enhanced Header */}
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-gradient-to-br from-command-accent to-command-success rounded-lg relative overflow-hidden"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: ['0 0 20px rgba(0, 212, 255, 0.3)', '0 0 30px rgba(0, 212, 255, 0.6)', '0 0 20px rgba(0, 212, 255, 0.3)']
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-lg"
                    animate={{
                      opacity: [0, 0.3, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <Bot className="h-5 w-5 text-white relative z-10" />
                </motion.div>
                <div>
                  <CardTitle className="text-lg">AI Support Collective</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Neural NLP Engine Online</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs ml-1">
                      Live
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Real-time stats */}
                <div className="text-xs text-muted-foreground">
                  <div>Msgs: {conversationStats.totalMessages}</div>
                  <div>Conf: {(conversationStats.avgConfidence * 100).toFixed(0)}%</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:bg-command-accent/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Messages with enhanced display */}
          <CardContent className="flex-1 flex flex-col p-0 relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.type !== 'user' && (
                    <div className="p-1.5 bg-command-accent/20 rounded-full">
                      <Bot className="h-3 w-3 text-command-accent" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] p-3 rounded-lg text-sm relative",
                      message.type === 'user'
                        ? "bg-primary text-primary-foreground"
                        : message.type === 'system'
                        ? "bg-command-success/10 text-command-success border border-command-success/20"
                        : "bg-muted text-muted-foreground border border-border/50"
                    )}
                  >
                    {message.content}
                    
                    {/* Show AI insights for bot messages */}
                    {message.type === 'bot' && message.intent && message.confidence && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Badge variant="outline" className="bg-command-accent/10 text-command-accent border-command-accent/20">
                          {message.intent.replace('_', ' ')}
                        </Badge>
                        <span className="text-muted-foreground">
                          {(message.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="p-1.5 bg-primary/20 rounded-full">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Enhanced typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="p-1.5 bg-command-accent/20 rounded-full">
                    <Brain className="h-3 w-3 text-command-accent" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-command-accent rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-command-accent rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-command-accent rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">AI processing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="p-4 border-t border-border/50">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Quick Actions
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { key: 'agent_capabilities', label: 'Agent Capabilities' },
                    { key: 'pricing_info', label: 'Pricing Info' },
                    { key: 'demo_request', label: 'Request Demo' },
                    { key: 'technical_support', label: 'Tech Support' }
                  ].map((action) => (
                    <Button
                      key={action.key}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickAction(action.key)}
                      className="w-full justify-start text-xs h-auto p-2 hover:bg-command-accent/10"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Production Lead Capture Form */}
            <AnimatePresence>
              {showLeadForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border/50 p-4 bg-command-accent/5"
                >
                  <div className="space-y-3">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-command-accent" />
                      Connect with Our Super Agent Specialists
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Full Name"
                        value={leadData.name}
                        onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                        className="text-xs h-8 bg-card/50 border-command-accent/20"
                      />
                      <Input
                        placeholder="Company"
                        value={leadData.company}
                        onChange={(e) => setLeadData(prev => ({ ...prev, company: e.target.value }))}
                        className="text-xs h-8 bg-card/50 border-command-accent/20"
                      />
                    </div>
                    <Input
                      placeholder="Business Email"
                      type="email"
                      value={leadData.email}
                      onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                      className="text-xs h-8 bg-card/50 border-command-accent/20"
                    />
                    <Textarea
                      placeholder="How can our Super Agent Group help your organization?"
                      value={leadData.message}
                      onChange={(e) => setLeadData(prev => ({ ...prev, message: e.target.value }))}
                      className="text-xs h-16 resize-none bg-card/50 border-command-accent/20"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleLeadSubmit}
                        disabled={!leadData.name || !leadData.email}
                        className="flex-1 text-xs h-8 bg-gradient-to-r from-command-accent to-command-success"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Connect with Specialist
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowLeadForm(false)}
                        className="text-xs h-8 border-command-accent/20"
                      >
                        Later
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Enhanced Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about our Super Agent Group capabilities..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 text-sm bg-card/50 border-command-accent/20 focus:border-command-accent/40"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-command-accent hover:bg-command-accent/80"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}