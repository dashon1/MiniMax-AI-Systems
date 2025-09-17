import { motion } from 'framer-motion'
import { Brain, Cpu, Zap, Target } from 'lucide-react'

interface Agent {
  name: string
  position: { x: number; y: number }
  color: string
  icon: React.ComponentType<any>
  description: string
}

const agents: Agent[] = [
  {
    name: 'MANUS',
    position: { x: -200, y: -150 },
    color: '#00D4FF',
    icon: Target,
    description: 'TACTICAL AUTOMATION'
  },
  {
    name: 'GENSPARK',
    position: { x: 200, y: -150 },
    color: '#FF0080',
    icon: Zap,
    description: 'CREATIVE GENERATION'
  },
  {
    name: 'ABACUS',
    position: { x: -200, y: 150 },
    color: '#00FF88',
    icon: Cpu,
    description: 'LOGICAL OPTIMIZATION'
  },
  {
    name: 'MINIMAX',
    position: { x: 200, y: 150 },
    color: '#8000FF',
    icon: Brain,
    description: 'STRATEGIC INTELLIGENCE'
  }
]

export function BrainVisualization() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Connecting Lines to Agents */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {agents.map((agent, index) => (
          <motion.line
            key={index}
            x1="50%"
            y1="50%"
            x2={`calc(50% + ${agent.position.x}px)`}
            y2={`calc(50% + ${agent.position.y}px)`}
            stroke={`url(#gradient-${index})`}
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 2, delay: index * 0.2 }}
          />
        ))}
        
        {/* Gradient Definitions */}
        <defs>
          {agents.map((agent, index) => (
            <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor={agent.color} stopOpacity="0.8" />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Central Brain */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="relative">
          {/* Brain Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, rgba(255,0,128,0.3) 100%)',
              filter: 'blur(20px)',
              scale: 1.5
            }}
            animate={{
              scale: [1.5, 1.7, 1.5],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          {/* Brain Container */}
          <div className="relative w-64 h-64 rounded-full flex items-center justify-center">
            {/* Brain Background */}
            <motion.div
              className="absolute inset-4 rounded-full border-2 border-transparent"
              style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #FF0080 100%)',
                maskImage: 'radial-gradient(circle, black 70%, transparent 70%)'
              }}
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }}
            />

            {/* Brain Icon */}
            <motion.div
              className="relative z-10 p-8 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, rgba(255,0,128,0.2) 100%)',
                backdropFilter: 'blur(10px)'
              }}
              animate={{
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Brain className="w-20 h-20 text-white" />
            </motion.div>

            {/* CONCEPT Text (Above Brain) */}
            <motion.div
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="text-white text-xl font-bold tracking-[0.3em] opacity-80">
                CONCEPT
              </div>
            </motion.div>

            {/* ARA M5 Text (Below Brain) - Enhanced Prominence */}
            <motion.div
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center z-30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              style={{ zIndex: 30 }}
            >
              {/* Enhanced Glow Background for ARA M5 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(255,0,128,0.4) 100%)',
                  filter: 'blur(30px)',
                  scale: 2
                }}
                animate={{
                  scale: [2, 2.5, 2],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              
              <motion.div 
                className="relative text-7xl font-black tracking-[0.2em] z-40"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #FF0080 50%, #00FF88 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.8)) drop-shadow(0 0 60px rgba(255,0,128,0.6))',
                  zIndex: 40
                }}
                animate={{
                  textShadow: [
                    '0 0 30px rgba(0,212,255,0.8), 0 0 60px rgba(255,0,128,0.6)',
                    '0 0 50px rgba(255,0,128,1), 0 0 80px rgba(0,255,136,0.8)', 
                    '0 0 30px rgba(0,212,255,0.8), 0 0 60px rgba(255,0,128,0.6)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                ARA M5
              </motion.div>
              
              {/* Additional subtle glow ring around ARA M5 */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-32 border border-transparent rounded-full"
                style={{
                  borderImage: 'linear-gradient(135deg, #00D4FF, #FF0080, #00FF88) 1',
                  boxShadow: 'inset 0 0 30px rgba(0,212,255,0.2), 0 0 40px rgba(255,0,128,0.3)'
                }}
                animate={{
                  boxShadow: [
                    'inset 0 0 30px rgba(0,212,255,0.2), 0 0 40px rgba(255,0,128,0.3)',
                    'inset 0 0 50px rgba(255,0,128,0.3), 0 0 60px rgba(0,255,136,0.4)',
                    'inset 0 0 30px rgba(0,212,255,0.2), 0 0 40px rgba(255,0,128,0.3)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Agent Nodes */}
      {agents.map((agent, index) => {
        const IconComponent = agent.icon
        return (
          <motion.div
            key={agent.name}
            className="absolute z-20"
            style={{
              left: `calc(50% + ${agent.position.x}px)`,
              top: `calc(50% + ${agent.position.y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.5 + index * 0.1 }}
          >
            <div className="text-center">
              {/* Agent Icon */}
              <motion.div
                className="relative mb-2"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                  style={{
                    background: `radial-gradient(circle, ${agent.color}20 0%, transparent 70%)`,
                    borderColor: agent.color,
                    boxShadow: `0 0 20px ${agent.color}40`
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 20px ${agent.color}40`,
                      `0 0 30px ${agent.color}60`,
                      `0 0 20px ${agent.color}40`
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <IconComponent className="w-6 h-6" style={{ color: agent.color }} />
                </motion.div>
              </motion.div>

              {/* Agent Name */}
              <div className="text-white font-bold text-sm mb-1 tracking-wider">
                {agent.name}
              </div>

              {/* Agent Description */}
              <div 
                className="text-xs font-medium tracking-wide"
                style={{ color: agent.color }}
              >
                {agent.description}
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? '#00D4FF' : '#FF0080',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}