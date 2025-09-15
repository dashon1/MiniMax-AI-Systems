import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AILoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'neural' | 'circuit' | 'processing' | 'quantum'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

const NeuralSpinner = ({ size = 'md', className }: { size: string; className?: string }) => (
  <div className={cn('relative', sizeClasses[size as keyof typeof sizeClasses], className)}>
    {/* Central node */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-80"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
    
    {/* Orbiting nodes */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-blue-400 rounded-full"
        style={{
          top: '50%',
          left: '50%',
          transformOrigin: '0 0'
        }}
        animate={{
          rotate: [0, 360],
          x: [0, 20, 0, -20, 0],
          y: [0, -10, 0, 10, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: i * 0.5,
          ease: 'linear'
        }}
      />
    ))}
  </div>
)

const CircuitSpinner = ({ size = 'md', className }: { size: string; className?: string }) => (
  <div className={cn('relative', sizeClasses[size as keyof typeof sizeClasses], className)}>
    {/* Main circuit ring */}
    <motion.div
      className="absolute inset-0 border-2 border-green-500 rounded-full border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
    
    {/* Inner processing dots */}
    <motion.div
      className="absolute inset-2 border border-green-400 rounded-full border-b-transparent"
      animate={{ rotate: -360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
    
    {/* Central processor */}
    <motion.div
      className="absolute inset-1/3 bg-green-500 rounded-sm"
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [0.8, 1, 0.8]
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  </div>
)

const ProcessingSpinner = ({ size = 'md', className }: { size: string; className?: string }) => (
  <div className={cn('relative', sizeClasses[size as keyof typeof sizeClasses], className)}>
    {/* Data streams */}
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="absolute w-1 bg-gradient-to-t from-transparent via-purple-500 to-transparent rounded-full"
        style={{
          height: '100%',
          left: `${25 + i * 16.67}%`,
          transformOrigin: 'center'
        }}
        animate={{
          scaleY: [0.3, 1, 0.3],
          opacity: [0.3, 1, 0.3]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
)

const QuantumSpinner = ({ size = 'md', className }: { size: string; className?: string }) => (
  <div className={cn('relative', sizeClasses[size as keyof typeof sizeClasses], className)}>
    {/* Quantum particles */}
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
        style={{
          top: '50%',
          left: '50%'
        }}
        animate={{
          x: [0, 15 * Math.cos((i * 72) * Math.PI / 180), 0],
          y: [0, 15 * Math.sin((i * 72) * Math.PI / 180), 0],
          scale: [0.5, 1, 0.5],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.1,
          ease: 'easeInOut'
        }}
      />
    ))}
    
    {/* Central quantum core */}
    <motion.div
      className="absolute inset-1/3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
      animate={{
        rotate: [0, 360],
        scale: [0.8, 1.2, 0.8]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  </div>
)

export function AILoadingSpinner({ 
  size = 'md', 
  variant = 'neural', 
  className,
  text 
}: AILoadingSpinnerProps) {
  const renderSpinner = () => {
    switch (variant) {
      case 'neural':
        return <NeuralSpinner size={size} className={className} />
      case 'circuit':
        return <CircuitSpinner size={size} className={className} />
      case 'processing':
        return <ProcessingSpinner size={size} className={className} />
      case 'quantum':
        return <QuantumSpinner size={size} className={className} />
      default:
        return <NeuralSpinner size={size} className={className} />
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {renderSpinner()}
      {text && (
        <motion.p
          className="text-sm text-muted-foreground font-medium"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export default AILoadingSpinner