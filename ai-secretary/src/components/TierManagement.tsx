import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { 
  Crown, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Sparkles, 
  CreditCard,
  ArrowUp,
  Check,
  Star
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TierManagementProps {
  currentTier?: 'standard' | 'pro' | 'enterprise'
  creditsUsed?: number
  creditsTotal?: number
  className?: string
}

export function TierManagement({ 
  currentTier = 'standard', 
  creditsUsed = 45, 
  creditsTotal = 100,
  className 
}: TierManagementProps) {
  const { user } = useAuth()
  const [isUpgrading, setIsUpgrading] = useState(false)
  
  const creditPercentage = Math.round((creditsUsed / creditsTotal) * 100)
  const isNearLimit = creditPercentage > 80
  const isOverLimit = creditPercentage > 95
  
  const handleUpgrade = async (targetTier: string) => {
    setIsUpgrading(true)
    try {
      // Simulate upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Successfully upgraded to ${targetTier} tier!`)
    } catch (error) {
      toast.error('Upgrade failed. Please try again.')
    } finally {
      setIsUpgrading(false)
    }
  }
  
  const tierPlans = [
    {
      tier: 'standard',
      name: 'Standard',
      price: 'Free',
      credits: 100,
      color: 'from-blue-500 to-blue-600',
      icon: Shield,
      features: [
        '100 credits/month',
        'Basic agent access',
        'Standard support',
        'Core analytics'
      ],
      limitations: [
        'Limited agent selection',
        'Basic priority',
        'Standard response time'
      ]
    },
    {
      tier: 'pro',
      name: 'Pro',
      price: '$49.99/month',
      credits: 2000,
      color: 'from-purple-500 to-purple-600',
      icon: Crown,
      features: [
        '2,000 credits/month',
        'Full agent access',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        '$0.05/credit overage'
      ],
      limitations: []
    }
  ]
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Tier Status */}
      <AIGlowCard 
        glowColor={currentTier === 'pro' ? 'purple' : 'blue'}
        intensity="medium"
        className="relative overflow-hidden"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  "p-3 rounded-xl bg-gradient-to-br shadow-lg",
                  currentTier === 'pro' ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {currentTier === 'pro' ? (
                  <Crown className="h-6 w-6 text-white" />
                ) : (
                  <Shield className="h-6 w-6 text-white" />
                )}
              </motion.div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="capitalize">{currentTier} Tier</span>
                  {currentTier === 'pro' && (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-4 w-4 text-purple-400" />
                    </motion.div>
                  )}
                </CardTitle>
                <CardDescription>
                  {currentTier === 'pro' 
                    ? 'Full access to AEROS neural collective' 
                    : 'Essential access to core agents'
                  }
                </CardDescription>
              </div>
            </div>
            
            <Badge 
              variant={currentTier === 'pro' ? 'default' : 'secondary'}
              className={cn(
                "text-xs font-bold px-3 py-1",
                currentTier === 'pro' 
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-blue-500/20 text-blue-400'
              )}
            >
              {currentTier === 'pro' ? 'PRO' : 'STANDARD'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Credit Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Credit Usage</span>
              <span className="text-sm text-muted-foreground">
                {creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={creditPercentage} 
              className={cn(
                "h-2",
                isOverLimit ? "bg-red-500/20" : isNearLimit ? "bg-yellow-500/20" : "bg-green-500/20"
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                "font-medium",
                isOverLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-green-400"
              )}>
                {creditPercentage}% used
              </span>
              {isNearLimit && (
                <span className="text-muted-foreground">
                  {isOverLimit ? 'Credit limit exceeded' : 'Approaching limit'}
                </span>
              )}
            </div>
          </div>
          
          {/* Upgrade Prompt */}
          {currentTier === 'standard' && isNearLimit && (
            <motion.div
              className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ready to unlock full potential?</p>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to Pro for 20x more credits and full agent access
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleUpgrade('pro')}
                  disabled={isUpgrading}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90"
                >
                  {isUpgrading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="h-3 w-3" />
                    </motion.div>
                  ) : (
                    <><ArrowUp className="h-3 w-3 mr-1" />Upgrade</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </AIGlowCard>
      
      {/* Tier Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tierPlans.map((plan, index) => {
          const Icon = plan.icon
          const isCurrentTier = plan.tier === currentTier
          const isPro = plan.tier === 'pro'
          
          return (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AIGlowCard
                glowColor={isPro ? 'purple' : 'blue'}
                intensity={isCurrentTier ? 'high' : 'low'}
                className={cn(
                  "relative h-full transition-all duration-300",
                  isCurrentTier && "ring-2 ring-offset-2",
                  isPro ? "ring-purple-500 ring-offset-purple-500/10" : "ring-blue-500 ring-offset-blue-500/10"
                )}
              >
                {isPro && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      <Star className="h-3 w-3 mr-1" />
                      POPULAR
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={cn(
                        "p-3 rounded-xl bg-gradient-to-br shadow-lg",
                        plan.color
                      )}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {isCurrentTier && (
                          <Badge variant="outline" className="text-xs">
                            CURRENT
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-lg font-bold">
                        {plan.price}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Features</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {!isCurrentTier && (
                    <Button 
                      className={cn(
                        "w-full",
                        isPro 
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90"
                      )}
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <Zap className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      {isPro ? 'Upgrade to Pro' : 'Downgrade'}
                    </Button>
                  )}
                </CardContent>
              </AIGlowCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}