import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { BrainVisualization } from '@/components/BrainVisualization'
import { CommandCenterSidebar } from '@/components/CommandCenterSidebar'
import { motion } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'

export function RedesignedAuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Command Center Background */}
      <CommandCenterBackground variant="holographic" color="command" className="absolute inset-0" />
      
      {/* Neural Grid Pattern */}
      <div className="absolute inset-0 command-grid opacity-20" />
      
      {/* Theme Toggle */}
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Command Center Sidebar */}
      <CommandCenterSidebar />
      
      {/* Main Content Area */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          className="text-center pt-16 pb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-6xl font-black mb-4"
            style={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #FF0080 50%, #00FF88 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0,212,255,0.5)'
            }}
            animate={{
              textShadow: [
                '0 0 30px rgba(0,212,255,0.5)',
                '0 0 50px rgba(255,0,128,0.7)', 
                '0 0 30px rgba(0,255,136,0.5)',
                '0 0 30px rgba(0,212,255,0.5)'
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            AGENTS UNITE
          </motion.h1>
          
          <motion.div
            className="text-2xl text-white font-bold mb-2 flex items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span>Join Forces to Unlock and Regain Your Time Again!</span>
            <Zap className="w-6 h-6 text-blue-400" />
          </motion.div>
          
          <motion.p
            className="text-lg text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Experience the most powerful AI agent collective designed to revolutionize productivity through unified intelligence
          </motion.p>
        </motion.div>
        
        {/* Brain Visualization Area */}
        <div className="flex-1 flex items-center justify-center px-8">
          <motion.div
            className="w-full max-w-4xl aspect-square relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
          >
            <BrainVisualization />
          </motion.div>
        </div>
        
        {/* Call to Action */}
        <motion.div
          className="text-center pb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <motion.div
            className="inline-block px-8 py-3 rounded-full border-2 border-blue-400/50 bg-blue-500/10 backdrop-blur-sm"
            animate={{
              borderColor: ['rgba(59, 130, 246, 0.5)', 'rgba(236, 72, 153, 0.5)', 'rgba(34, 197, 94, 0.5)', 'rgba(59, 130, 246, 0.5)']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="text-white font-semibold text-lg tracking-wide">
              MEET THE AGENTS
            </div>
            <div className="text-blue-400 text-sm mt-1">
              Access the Command Center to Begin →
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              background: i % 3 === 0 ? '#00D4FF' : i % 3 === 1 ? '#FF0080' : '#00FF88',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -200, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  )
}