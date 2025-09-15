import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CustomerServiceBot } from '@/components/CustomerServiceBot'
import { MessageSquare, X, Sparkles, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FloatingChatBotProps {
  className?: string
}

export function FloatingChatBot({ className }: FloatingChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(true)
  
  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHasNewMessage(false)
    }
  }
  
  const handleLeadCapture = (data: { name: string; email: string; company: string; message: string }) => {
    console.log('Lead captured:', data)
    // Here you would typically send this data to your backend
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <CustomerServiceBot
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onLeadCapture={handleLeadCapture}
      />
      
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
          >
            <Button
              onClick={handleToggle}
              size="lg"
              className="h-16 w-16 rounded-full bg-gradient-to-br from-command-accent to-command-success hover:from-command-accent/80 hover:to-command-success/80 shadow-2xl border-2 border-white/20 group"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
              >
                <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </motion.div>
            </Button>
            
            {/* Notification indicator */}
            <AnimatePresence>
              {hasNewMessage && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-command-accent to-command-success opacity-30"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            {/* Welcome tooltip */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-card/90 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-xl max-w-xs"
            >
              <div className="flex items-start gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Bot className="h-4 w-4 text-command-accent mt-0.5" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Welcome to Super Agent HQ!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Need help with our agent collective? Click to chat with our AI assistant.
                  </p>
                </div>
              </div>
              <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-card border-r border-b border-border/50 rotate-45" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}