import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CommandCenterBackgroundProps {
  className?: string
  variant?: 'subtle' | 'prominent' | 'dynamic' | 'holographic'
  color?: 'blue' | 'purple' | 'green' | 'multi' | 'orange' | 'red' | 'command'
}

const colorSchemes = {
  blue: {
    primary: 'rgba(0, 212, 255, 0.15)',
    secondary: 'rgba(0, 212, 255, 0.08)',
    accent: 'rgba(0, 212, 255, 0.25)',
    glow: '#00D4FF'
  },
  purple: {
    primary: 'rgba(168, 85, 247, 0.15)',
    secondary: 'rgba(168, 85, 247, 0.08)',
    accent: 'rgba(168, 85, 247, 0.25)',
    glow: '#A855F7'
  },
  green: {
    primary: 'rgba(0, 255, 136, 0.15)',
    secondary: 'rgba(0, 255, 136, 0.08)',
    accent: 'rgba(0, 255, 136, 0.25)',
    glow: '#00FF88'
  },
  orange: {
    primary: 'rgba(251, 146, 60, 0.15)',
    secondary: 'rgba(251, 146, 60, 0.08)',
    accent: 'rgba(251, 146, 60, 0.25)',
    glow: '#FB923C'
  },
  red: {
    primary: 'rgba(255, 0, 64, 0.15)',
    secondary: 'rgba(255, 0, 64, 0.08)',
    accent: 'rgba(255, 0, 64, 0.25)',
    glow: '#FF0040'
  },
  multi: {
    primary: 'rgba(0, 212, 255, 0.12)',
    secondary: 'rgba(168, 85, 247, 0.12)',
    accent: 'rgba(0, 255, 136, 0.12)',
    glow: '#00D4FF'
  },
  command: {
    primary: 'rgba(0, 212, 255, 0.2)',
    secondary: 'rgba(0, 255, 136, 0.15)',
    accent: 'rgba(255, 0, 64, 0.1)',
    glow: '#00FF88'
  }
}

export function CommandCenterBackground({ 
  className, 
  variant = 'subtle', 
  color = 'command' 
}: CommandCenterBackgroundProps) {
  const colors = colorSchemes[color]
  
  const generateNodes = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const x = Math.random() * 100
      const y = Math.random() * 100
      const delay = Math.random() * 3
      const duration = 2 + Math.random() * 2
      
      return (
        <motion.g key={`node-${i}`}>
          <motion.circle
            cx={`${x}%`}
            cy={`${y}%`}
            r={variant === 'prominent' ? '2' : variant === 'holographic' ? '1.5' : '1'}
            fill={colors.primary}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
              r: [1, 2, 1]
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay
            }}
          />
          {variant === 'holographic' && (
            <motion.circle
              cx={`${x}%`}
              cy={`${y}%`}
              r="4"
              fill="none"
              stroke={colors.accent}
              strokeWidth="0.5"
              animate={{
                r: [2, 6, 2],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: duration + 1,
                repeat: Infinity,
                ease: 'easeOut',
                delay: delay + 0.5
              }}
            />
          )}
        </motion.g>
      )
    })
  }
  
  const generateConnections = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const x1 = Math.random() * 100
      const y1 = Math.random() * 100
      const angle = Math.random() * Math.PI * 2
      const length = 15 + Math.random() * 20
      const x2 = Math.max(0, Math.min(100, x1 + Math.cos(angle) * length))
      const y2 = Math.max(0, Math.min(100, y1 + Math.sin(angle) * length))
      const delay = Math.random() * 4
      
      return (
        <motion.line
          key={`connection-${i}`}
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
          stroke={colors.secondary}
          strokeWidth={variant === 'holographic' ? '1' : '0.5'}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.8, 0],
            strokeWidth: variant === 'dynamic' ? [0.5, 1.5, 0.5] : undefined
          }}
          transition={{
            duration: 4 + delay,
            repeat: Infinity,
            ease: 'easeInOut',
            delay
          }}
        />
      )
    })
  }
  
  const generateHolographicGrid = () => {
    const lines = []
    const spacing = 10
    
    // Vertical lines
    for (let i = 0; i <= 100; i += spacing) {
      lines.push(
        <motion.line
          key={`v-${i}`}
          x1={`${i}%`}
          y1="0%"
          x2={`${i}%`}
          y2="100%"
          stroke={colors.secondary}
          strokeWidth="0.25"
          animate={{
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: (i / spacing) * 0.1
          }}
        />
      )
    }
    
    // Horizontal lines
    for (let i = 0; i <= 100; i += spacing) {
      lines.push(
        <motion.line
          key={`h-${i}`}
          x1="0%"
          y1={`${i}%`}
          x2="100%"
          y2={`${i}%`}
          stroke={colors.secondary}
          strokeWidth="0.25"
          animate={{
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: (i / spacing) * 0.1 + 0.5
          }}
        />
      )
    }
    
    return lines
  }
  
  const generateEnergyFlows = () => {
    return Array.from({ length: 3 }, (_, i) => (
      <motion.circle
        key={`energy-${i}`}
        r="1.5"
        fill={colors.accent}
        initial={{ 
          cx: '0%', 
          cy: `${25 + i * 25}%`,
          opacity: 0
        }}
        animate={{
          cx: ['0%', '100%'],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          delay: i * 2,
          ease: 'linear'
        }}
      />
    ))
  }
  
  const nodeCount = {
    subtle: 12,
    prominent: 20,
    dynamic: 30,
    holographic: 25
  }[variant]
  
  const connectionCount = {
    subtle: 8,
    prominent: 15,
    dynamic: 25,
    holographic: 20
  }[variant]

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <svg 
        className="absolute inset-0 w-full h-full" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`nodeGradient-${color}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.2" />
          </radialGradient>
          
          <filter id={`commandGlow-${color}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
          
          <linearGradient id={`energyGradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.glow} stopOpacity="0" />
            <stop offset="50%" stopColor={colors.glow} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Holographic grid */}
        {variant === 'holographic' && (
          <g opacity="0.3">
            {generateHolographicGrid()}
          </g>
        )}
        
        {/* Neural connections */}
        <g filter={variant === 'dynamic' || variant === 'holographic' ? `url(#commandGlow-${color})` : undefined}>
          {generateConnections(connectionCount)}
        </g>
        
        {/* Neural nodes */}
        <g filter={variant === 'dynamic' || variant === 'holographic' ? `url(#commandGlow-${color})` : undefined}>
          {generateNodes(nodeCount)}
        </g>
        
        {/* Energy flow particles */}
        {(variant === 'dynamic' || variant === 'holographic') && (
          <g>
            {generateEnergyFlows()}
          </g>
        )}
        
        {/* Matrix-style scanning lines */}
        {variant === 'holographic' && (
          <g>
            <motion.line
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
              stroke={`url(#energyGradient-${color})`}
              strokeWidth="2"
              animate={{
                y1: ['0%', '100%'],
                y2: ['0%', '100%']
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </g>
        )}
      </svg>
    </div>
  )
}

export default CommandCenterBackground