import { useAgents } from '@/hooks/useTasks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { NeuralBackground } from '@/components/ui/neural-background'
import { Brain, Zap, Lightbulb, Building2, Activity, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const agentIcons = {
  genspark: Brain,
  abacus: Zap, 
  minimax: Lightbulb,
  manus: Building2
}

const agentColors = {
  genspark: 'from-blue-500 to-blue-600',
  abacus: 'from-green-500 to-green-600', 
  minimax: 'from-purple-500 to-purple-600',
  manus: 'from-orange-500 to-orange-600'
}

function AgentCard({ agent }: { agent: any }) {
  const Icon = agentIcons[agent.agent_name as keyof typeof agentIcons] || Brain
  const gradientColor = agentColors[agent.agent_name as keyof typeof agentColors]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="relative overflow-hidden"
    >
      <AIGlowCard 
        glowColor={agent.agent_name === 'genspark' ? 'blue' : 
                   agent.agent_name === 'abacus' ? 'green' : 
                   agent.agent_name === 'minimax' ? 'purple' : 'orange'}
        intensity="low"
        className="h-full"
      >
        {/* Neural background for each card */}
        <NeuralBackground 
          variant="subtle" 
          color={agent.agent_name === 'genspark' ? 'blue' : 
                 agent.agent_name === 'abacus' ? 'green' : 
                 agent.agent_name === 'minimax' ? 'purple' : 'multi'}
        />
        
        <CardHeader className="pb-3 relative">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`p-3 rounded-xl bg-gradient-to-br ${gradientColor} shadow-lg relative overflow-hidden`}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* AI processing indicator */}
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-xl"
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <Icon className="h-6 w-6 text-white relative z-10" />
            </motion.div>
            <div>
              <CardTitle className="text-lg capitalize flex items-center gap-2">
                {agent.agent_name}
                {agent.is_active && (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={agent.is_active ? 'default' : 'secondary'}
                  className={agent.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {agent.is_active ? '🟢 Active' : '⚫ Inactive'}
                </Badge>
                <Badge variant="outline" className="text-xs bg-muted/50">
                  {agent.pricing_model.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-sm text-muted-foreground mb-4">
            {agent.description}
          </p>
          
          <div>
            <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI Specializations
            </h4>
            <div className="flex flex-wrap gap-1">
              {agent.capability_keywords.slice(0, 6).map((keyword: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge variant="outline" className="text-xs bg-primary/5 hover:bg-primary/10 transition-colors">
                    {keyword}
                  </Badge>
                </motion.div>
              ))}
              {agent.capability_keywords.length > 6 && (
                <Badge variant="outline" className="text-xs bg-muted/30">
                  +{agent.capability_keywords.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </AIGlowCard>
    </motion.div>
  )
}

export function AgentOverview() {
  const { agents, loading } = useAgents()

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <NeuralBackground variant="subtle" color="blue" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Activity className="h-5 w-5 text-primary" />
            </motion.div>
            AI Agent Network
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="h-48 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg animate-pulse"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border-primary/20">
      {/* Enhanced neural background */}
      <NeuralBackground variant="prominent" color="multi" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <motion.div
                className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Activity className="h-5 w-5 text-white" />
              </motion.div>
              AI Agent Network
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              {agents.length} specialized AI agents orchestrating intelligent solutions
            </CardDescription>
          </div>
          
          <motion.div
            className="text-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-2xl font-bold text-primary">
              {agents.filter(a => a.is_active).length}
            </div>
            <div className="text-xs text-muted-foreground">
              Active Agents
            </div>
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </div>
        
        {/* AI Network Status */}
        <motion.div
          className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <span className="text-sm font-medium text-foreground">
                Neural Network Status: Optimal
              </span>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              All Systems Operational
            </Badge>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}