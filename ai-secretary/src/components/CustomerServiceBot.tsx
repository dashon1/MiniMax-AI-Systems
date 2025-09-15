import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { X, MessageSquare, Send, User, Bot, Sparkles, Zap, HelpCircle, Mail, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
}

interface CustomerServiceBotProps {
  isOpen: boolean
  onClose: () => void
  onLeadCapture?: (data: { name: string; email: string; company: string; message: string }) => void
}

const mockFAQs = [
  {
    question: "What is the AI Super Agent Group?",
    answer: "We are the industry's strongest unified AI agent collective, providing unparalleled task orchestration and intelligent automation capabilities across research, creative, business, technical, and data processing domains."
  },
  {
    question: "How does voice command processing work?",
    answer: "Our advanced neural voice processing system converts your speech into actionable tasks, automatically routing them to the optimal agent collective for maximum efficiency and accuracy."
  },
  {
    question: "What makes your agent group the strongest?",
    answer: "Our unified collective approach combines multiple specialized AI agents working in perfect harmony, delivering superior results compared to individual AI systems. We offer transparent processes, advanced orchestration, and industry-leading capabilities."
  },
  {
    question: "Can I customize agent behavior?",
    answer: "Yes! Our command center provides extensive fine-tuning controls, role-based access management, and real-time performance optimization for the entire agent collective."
  }
]

export function CustomerServiceBot({ isOpen, onClose, onLeadCapture }: CustomerServiceBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to the AI Super Agent Group Command Center! I\'m here to help you understand our strongest-in-industry agent collective.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  const addMessage = (type: 'user' | 'bot', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    addMessage('user', inputMessage)
    setInputMessage('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const response = generateBotResponse(inputMessage)
      addMessage('bot', response)
      setIsTyping(false)
    }, 1500)
  }

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      return "Our AI Super Agent Group offers flexible pricing tiers designed for different organizational needs. Would you like me to connect you with our team to discuss pricing options that fit your specific requirements?"
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('trial')) {
      return "I'd be happy to arrange a personalized demonstration of our Super Agent Command Center! Our team can show you the full power of our unified agent collective. Shall I gather your contact information?"
    }
    
    if (lowerMessage.includes('voice') || lowerMessage.includes('speech')) {
      return "Our neural voice processing system is one of our most advanced features! It provides real-time voice-to-task conversion with intelligent agent routing. You can literally speak your commands and watch our agent collective execute them with precision."
    }
    
    if (lowerMessage.includes('agent') || lowerMessage.includes('ai')) {
      return "Our unified AI agent collective consists of specialized groups: Research & Intelligence, Creative & Content, Business & Strategy, Technical & Development, and Data & Automation. Each group works in perfect harmony to deliver superior results."
    }
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('sales') || lowerMessage.includes('talk')) {
      setShowLeadForm(true)
      return "Perfect! I'll help you get connected with our team. Please fill out the quick form I'm opening for you, and we'll have someone reach out within 24 hours."
    }
    
    // Check FAQs
    for (const faq of mockFAQs) {
      if (lowerMessage.includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' '))) {
        return faq.answer
      }
    }
    
    return "That's a great question! Our AI Super Agent Group is designed to handle complex tasks with unmatched efficiency. Would you like me to connect you with a specialist who can provide detailed information about your specific needs?"
  }

  const handleLeadSubmit = () => {
    if (leadData.name && leadData.email) {
      onLeadCapture?.(leadData)
      addMessage('bot', `Thank you ${leadData.name}! I've captured your information and our team will reach out to you within 24 hours. In the meantime, feel free to explore our command center and ask me any questions!`)
      setShowLeadForm(false)
      setLeadData({ name: '', email: '', company: '', message: '' })
    }
  }

  const handleFAQClick = (faq: { question: string; answer: string }) => {
    addMessage('user', faq.question)
    setTimeout(() => {
      addMessage('bot', faq.answer)
    }, 500)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 right-4 w-96 h-[600px] z-50"
      >
        <Card className="h-full flex flex-col border-command-accent/30 bg-card/95 backdrop-blur-md shadow-2xl">
          <CommandCenterBackground variant="subtle" color="command" />
          
          {/* Header */}
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-gradient-to-br from-command-accent to-command-success rounded-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-lg">AI Support Agent</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Super Agent Group Assistant
                  </CardDescription>
                </div>
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
          </CardHeader>
          
          {/* Messages */}
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
                      "max-w-[80%] p-3 rounded-lg text-sm",
                      message.type === 'user'
                        ? "bg-primary text-primary-foreground"
                        : message.type === 'system'
                        ? "bg-command-success/10 text-command-success border border-command-success/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.type === 'user' && (
                    <div className="p-1.5 bg-primary/20 rounded-full">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="p-1.5 bg-command-accent/20 rounded-full">
                    <Bot className="h-3 w-3 text-command-accent" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      />
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
                  Quick Questions
                </div>
                <div className="space-y-1">
                  {mockFAQs.slice(0, 2).map((faq, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFAQClick(faq)}
                      className="w-full justify-start text-xs h-auto p-2 hover:bg-command-accent/10"
                    >
                      {faq.question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Lead Capture Form */}
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
                      <Mail className="h-4 w-4 text-command-accent" />
                      Connect with Our Team
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Name"
                        value={leadData.name}
                        onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                        className="text-xs h-8"
                      />
                      <Input
                        placeholder="Company"
                        value={leadData.company}
                        onChange={(e) => setLeadData(prev => ({ ...prev, company: e.target.value }))}
                        className="text-xs h-8"
                      />
                    </div>
                    <Input
                      placeholder="Email"
                      type="email"
                      value={leadData.email}
                      onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                      className="text-xs h-8"
                    />
                    <Textarea
                      placeholder="What can we help you with?"
                      value={leadData.message}
                      onChange={(e) => setLeadData(prev => ({ ...prev, message: e.target.value }))}
                      className="text-xs h-16 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleLeadSubmit}
                        disabled={!leadData.name || !leadData.email}
                        className="flex-1 text-xs h-8"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Contact Me
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowLeadForm(false)}
                        className="text-xs h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about our Super Agent Group..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 text-sm"
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