import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NeuralBackgroundProps {
  className?: string
  variant?: 'subtle' | 'prominent' | 'dynamic'
  color?: 'blue' | 'purple' | 'green' | 'multi' | 'orange' | 'red'
}

const colorSchemes = {
  blue: {
    primary: 'rgba(59, 130, 246, 0.1)',
    secondary: 'rgba(59, 130, 246, 0.05)',
    accent: 'rgba(147, 197, 253, 0.1)'
  },
  purple: {
    primary: 'rgba(168, 85, 247, 0.1)',
    secondary: 'rgba(168, 85, 247, 0.05)',
    accent: 'rgba(196, 181, 253, 0.1)'
  },
  green: {
    primary: 'rgba(34, 197, 94, 0.1)',
    secondary: 'rgba(34, 197, 94, 0.05)',
    accent: 'rgba(134, 239, 172, 0.1)'
  },
  orange: {
    primary: 'rgba(251, 146, 60, 0.1)',
    secondary: 'rgba(251, 146, 60, 0.05)',
    accent: 'rgba(253, 186, 116, 0.1)'
  },
  red: {
    primary: 'rgba(239, 68, 68, 0.1)',
    secondary: 'rgba(239, 68, 68, 0.05)',
    accent: 'rgba(252, 165, 165, 0.1)'
  },
  multi: {
    primary: 'rgba(59, 130, 246, 0.08)',
    secondary: 'rgba(168, 85, 247, 0.08)',
    accent: 'rgba(34, 197, 94, 0.08)'
  }
}

export function NeuralBackground({ 
  className, 
  variant = 'subtle', 
  color = 'blue' 
}: NeuralBackgroundProps) {
  const colors = colorSchemes[color]
  
  const generateNodes = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const x = Math.random() * 100
      const y = Math.random() * 100
      const delay = Math.random() * 2
      
      return (
        <motion.circle
          key={i}
          cx={`${x}%`}
          cy={`${y}%`}
          r={variant === 'prominent' ? '1.5' : '1'}
          fill={colors.primary}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            r: [1, 1.5, 1]
          }}
          transition={{
            duration: 3 + delay,
            repeat: Infinity,
            ease: 'easeInOut',
            delay
          }}
        />
      )
    })
  }
  
  const generateConnections = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const x1 = Math.random() * 100
      const y1 = Math.random() * 100
      const x2 = x1 + (Math.random() - 0.5) * 30
      const y2 = y1 + (Math.random() - 0.5) * 30
      const delay = Math.random() * 3
      
      return (
        <motion.line
          key={i}
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${Math.max(0, Math.min(100, x2))}%`}
          y2={`${Math.max(0, Math.min(100, y2))}%`}
          stroke={colors.secondary}
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.6, 0]
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
  
  const nodeCount = {
    subtle: 15,
    prominent: 25,
    dynamic: 35
  }[variant]
  
  const connectionCount = {
    subtle: 8,
    prominent: 15,
    dynamic: 25
  }[variant]

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <svg 
        className="absolute inset-0 w-full h-full" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.2" />
          </radialGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        {/* Neural connections */}
        <g filter={variant === 'dynamic' ? 'url(#glow)' : undefined}>
          {generateConnections(connectionCount)}
        </g>
        
        {/* Neural nodes */}
        <g filter={variant === 'dynamic' ? 'url(#glow)' : undefined}>
          {generateNodes(nodeCount)}
        </g>
        
        {/* Dynamic data flow particles for dynamic variant */}
        {variant === 'dynamic' && (
          <g>
            {Array.from({ length: 5 }, (_, i) => (
              <motion.circle
                key={`particle-${i}`}
                r="0.8"
                fill={colors.accent}
                initial={{ 
                  cx: '0%', 
                  cy: `${20 + i * 15}%`,
                  opacity: 0
                }}
                animate={{
                  cx: ['0%', '100%'],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 1.2,
                  ease: 'linear'
                }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}

export default NeuralBackground