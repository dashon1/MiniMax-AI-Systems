import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AIGlowCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  intensity?: 'low' | 'medium' | 'high'
  animated?: boolean
}

const glowColors = {
  blue: {
    shadow: 'rgba(59, 130, 246, 0.3)',
    border: 'border-blue-500/20',
    gradient: 'from-blue-500/5 to-blue-500/10'
  },
  purple: {
    shadow: 'rgba(168, 85, 247, 0.3)',
    border: 'border-purple-500/20',
    gradient: 'from-purple-500/5 to-purple-500/10'
  },
  green: {
    shadow: 'rgba(34, 197, 94, 0.3)',
    border: 'border-green-500/20',
    gradient: 'from-green-500/5 to-green-500/10'
  },
  orange: {
    shadow: 'rgba(251, 146, 60, 0.3)',
    border: 'border-orange-500/20',
    gradient: 'from-orange-500/5 to-orange-500/10'
  },
  red: {
    shadow: 'rgba(239, 68, 68, 0.3)',
    border: 'border-red-500/20',
    gradient: 'from-red-500/5 to-red-500/10'
  }
}

const intensityLevels = {
  low: '0 0 10px',
  medium: '0 0 20px',
  high: '0 0 30px'
}

export function AIGlowCard({
  children,
  className,
  glowColor = 'blue',
  intensity = 'medium',
  animated = true
}: AIGlowCardProps) {
  const colorScheme = glowColors[glowColor]
  const glowIntensity = intensityLevels[intensity]
  
  const cardVariants = {
    initial: { 
      boxShadow: `${glowIntensity} transparent`,
      scale: 1
    },
    hover: {
      boxShadow: `${glowIntensity} ${colorScheme.shadow}`,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  }
  
  const pulseVariants = {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  return (
    <motion.div
      className={cn(
        'relative rounded-lg border bg-card text-card-foreground transition-all duration-300',
        colorScheme.border,
        className
      )}
      variants={animated ? cardVariants : undefined}
      initial={animated ? 'initial' : undefined}
      whileHover={animated ? 'hover' : undefined}
      whileTap={animated ? 'tap' : undefined}
    >
      {/* Neural pattern overlay */}
      <div className={cn(
        'absolute inset-0 rounded-lg bg-gradient-to-br opacity-50',
        colorScheme.gradient
      )} />
      
      {/* Animated border pulse */}
      {animated && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-lg border-2 pointer-events-none',
            colorScheme.border
          )}
          variants={pulseVariants}
          initial="initial"
          animate="animate"
        />
      )}
      
      {/* Circuit pattern background */}
      <div className="absolute inset-0 opacity-5 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,currentColor_50%,transparent_55%)] bg-[length:10px_10px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

export default AIGlowCard