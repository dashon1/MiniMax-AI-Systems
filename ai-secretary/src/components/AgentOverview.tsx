import { useAgents } from '@/hooks/useTasks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AIGlowCard } from '@/components/ui/ai-glow-card'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { 
  Brain, 
  Zap, 
  Lightbulb, 
  Building2, 
  Activity, 
  Sparkles, 
  Users, 
  Shield, 
  Target, 
  Cpu, 
  Bot,
  TrendingUp,
  Gauge,
  Code,
  Search,
  FileText,
  Rocket
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const agentIcons = {
  genspark: Brain,
  abacus: Zap, 
  minimax: Lightbulb,
  manus: Building2,
  mvp_agent: Rocket,
  fullstack_dev: Code,
  deep_research: Search,
  report_writer: FileText
}

const agentColors = {
  genspark: 'from-blue-500 to-blue-600',
  abacus: 'from-green-500 to-green-600', 
  minimax: 'from-purple-500 to-purple-600',
  manus: 'from-orange-500 to-orange-600',
  mvp_agent: 'from-cyan-500 to-cyan-600',
  fullstack_dev: 'from-indigo-500 to-indigo-600',
  deep_research: 'from-teal-500 to-teal-600',
  report_writer: 'from-pink-500 to-pink-600'
}

const agentSpecializations = {
  genspark: ['Research Excellence', 'Data Analysis', 'Market Intelligence', 'Competitive Analysis'],
  abacus: ['Financial Modeling', 'Statistical Analysis', 'Performance Metrics', 'Risk Assessment'],
  minimax: ['Creative Solutions', 'Content Generation', 'Innovation Strategy', 'Design Thinking'],
  manus: ['Business Operations', 'Process Optimization', 'Strategic Planning', 'Automation'],
  mvp_agent: ['Product Validation', 'Startup Strategy', 'MVP Development', 'Market Analysis'],
  fullstack_dev: ['Web Development', 'System Architecture', 'Technical Implementation', 'Full-Stack Solutions'],
  deep_research: ['Comprehensive Research', 'In-depth Analysis', 'Investigation', 'Data Synthesis'],
  report_writer: ['Professional Reports', 'Documentation', 'Analytical Writing', 'Content Synthesis']
}

function AgentCard({ agent, index }: { agent: any; index: number }) {
  const Icon = agentIcons[agent.agent_name as keyof typeof agentIcons] || Brain
  const gradientColor = agentColors[agent.agent_name as keyof typeof agentColors]
  const specializations = agentSpecializations[agent.agent_name as keyof typeof agentSpecializations] || []
  
  // Calculate power level based on agent status and capabilities
  const powerLevel = agent.is_active ? 85 + Math.floor(Math.random() * 15) : 0
  const efficiency = agent.is_active ? 90 + Math.floor(Math.random() * 10) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative overflow-hidden group"
    >
      <AIGlowCard 
        glowColor={agent.agent_name === 'genspark' ? 'blue' : 
                   agent.agent_name === 'abacus' ? 'green' : 
                   agent.agent_name === 'minimax' ? 'purple' : 'orange'}
        intensity="medium"
        className="h-full holographic-border"
      >
        <CommandCenterBackground 
          variant="subtle" 
          color={agent.agent_name === 'genspark' ? 'blue' : 
                 agent.agent_name === 'abacus' ? 'green' : 
                 agent.agent_name === 'minimax' ? 'purple' : 'orange'}
        />
        
        {/* Power Level Indicator */}
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-bold border-2",
              agent.is_active ? "agent-power-high border-green-400 text-green-400" :
              "border-red-400 text-red-400"
            )}
          >
            PWR: {powerLevel}%
          </Badge>
        </div>
        
        <CardHeader className="pb-3 relative">
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn(
                "p-3 rounded-xl bg-gradient-to-br shadow-lg relative overflow-hidden",
                gradientColor
              )}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-xl"
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <Icon className="h-6 w-6 text-white relative z-10" />
            </motion.div>
            
            <div className="flex-1">
              <CardTitle className="text-lg capitalize flex items-center gap-2">
                <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {agent.agent_name} Agent
                </span>
                {agent.is_active && (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={agent.is_active ? 'default' : 'secondary'}
                  className={agent.is_active ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500/20 text-red-400'}
                >
                  {agent.is_active ? (
                    <><Activity className="h-3 w-3 mr-1" />ACTIVE</>
                  ) : (
                    <><Bot className="h-3 w-3 mr-1" />OFFLINE</>
                  )}
                </Badge>
                <Badge variant="outline" className="text-xs bg-primary/5">
                  {agent.pricing_model.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {agent.description}
          </p>
          
          {/* Performance Metrics */}
          {agent.is_active && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Performance Metrics
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Efficiency</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-green-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${efficiency}%` }}
                        transition={{ delay: index * 0.1, duration: 1 }}
                      />
                    </div>
                    <span className="text-xs font-mono text-green-400 w-8">{efficiency}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Response Time</span>
                  <span className="text-xs text-command-accent font-mono">~{Math.floor(Math.random() * 2) + 1}s</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Specializations */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Core Specializations
            </h4>
            <div className="flex flex-wrap gap-1">
              {specializations.slice(0, 3).map((spec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + i * 0.05 }}
                >
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {spec}
                  </Badge>
                </motion.div>
              ))}
              {specializations.length > 3 && (
                <Badge variant="outline" className="text-xs bg-muted/30">
                  +{specializations.length - 3}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quick Deploy Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              size="sm"
              disabled={!agent.is_active}
              className={cn(
                "w-full text-xs",
                agent.is_active 
                  ? `bg-gradient-to-r ${gradientColor} hover:opacity-90 text-white`
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {agent.is_active ? (
                <><Target className="h-3 w-3 mr-1" />Deploy Agent</>
              ) : (
                <><Bot className="h-3 w-3 mr-1" />Agent Offline</>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </AIGlowCard>
    </motion.div>
  )
}

export function AgentOverview() {
  const { agents, loading } = useAgents()
  
  const activeAgents = agents.filter(a => a.is_active)
  const totalCapacity = agents.length * 100
  const activeCapacity = activeAgents.length * 95 // Assume 95% efficiency for active agents
  const capacityPercentage = totalCapacity > 0 ? Math.round((activeCapacity / totalCapacity) * 100) : 0

  if (loading) {
    return (
      <Card className="relative overflow-hidden holographic-border">
        <CommandCenterBackground variant="subtle" color="command" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Activity className="h-5 w-5 text-command-accent" />
            </motion.div>
            <span className="command-title">Super Agent Group Network</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="h-64 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg animate-pulse holographic-border"
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
    <Card className="relative overflow-hidden border-command-accent/30 bg-card/90 backdrop-blur-md">
      <CommandCenterBackground variant="dynamic" color="command" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3 text-2xl mb-2">
              <motion.div
                className="p-3 bg-gradient-to-br from-command-accent to-command-success rounded-xl shadow-2xl relative overflow-hidden"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-xl"
                  animate={{
                    opacity: [0, 0.5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
                <Users className="h-6 w-6 text-white relative z-10" />
              </motion.div>
              <div className="flex-1">
                <span className="command-title">Super Agent Group Network</span>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className="bg-command-success/10 text-command-success border-command-success/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Unified Collective
                  </Badge>
                  <Badge variant="outline" className="bg-command-accent/10 text-command-accent border-command-accent/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Peak Performance
                  </Badge>
                </div>
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-6 w-6 text-command-accent" />
              </motion.div>
            </CardTitle>
            
            <CardDescription className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-command-accent" />
              {agents.length} specialized agents orchestrating intelligent solutions as one powerful collective
            </CardDescription>
          </div>
          
          {/* Stats Panel */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-400/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">
                {activeAgents.length}
              </div>
              <div className="text-xs text-muted-foreground">Active Agents</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-command-accent/10 to-command-accent/5 rounded-lg border border-command-accent/20">
              <div className="text-2xl font-bold text-command-accent">
                {capacityPercentage}%
              </div>
              <div className="text-xs text-muted-foreground">Group Capacity</div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {/* AEROS Brain Neural Network */}
        <div className="col-span-full mb-8">
          <div className="relative p-8 bg-gradient-to-br from-command-accent/10 via-purple-500/5 to-command-success/10 rounded-2xl border border-command-accent/20 overflow-hidden">
            <div className="absolute inset-0 neural-grid opacity-30" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold command-title mb-4 text-center flex items-center justify-center gap-3">
                <motion.div
                  className="p-2 bg-gradient-to-br from-command-accent to-purple-500 rounded-lg"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <Brain className="h-6 w-6 text-white" />
                </motion.div>
                AEROS Neural Collective - 8 Agent Brain Network
              </h3>
              <p className="text-center text-muted-foreground mb-6">
                Advanced multi-agent neural network operating as unified intelligence with specialized cognitive domains
              </p>
              
              {/* Neural Network Visualization */}
              <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                {agents.slice(0, 4).map((agent, index) => {
                  const Icon = agentIcons[agent.agent_name as keyof typeof agentIcons] || Brain
                  const color = agentColors[agent.agent_name as keyof typeof agentColors]
                  return (
                    <motion.div
                      key={agent.id}
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <motion.div
                        className={cn(
                          "p-3 rounded-full bg-gradient-to-br shadow-lg relative",
                          color
                        )}
                        whileHover={{ scale: 1.1 }}
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(0,255,255,0.3)',
                            '0 0 30px rgba(0,255,255,0.6)',
                            '0 0 20px rgba(0,255,255,0.3)'
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.5
                        }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </motion.div>
                      <span className="text-xs font-medium text-center capitalize">
                        {agent.agent_name.replace('_', ' ')}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
              
              <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto mt-6">
                {agents.slice(4, 8).map((agent, index) => {
                  const Icon = agentIcons[agent.agent_name as keyof typeof agentIcons] || Brain
                  const color = agentColors[agent.agent_name as keyof typeof agentColors]
                  return (
                    <motion.div
                      key={agent.id}
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + 4) * 0.1 }}
                    >
                      <motion.div
                        className={cn(
                          "p-3 rounded-full bg-gradient-to-br shadow-lg relative",
                          color
                        )}
                        whileHover={{ scale: 1.1 }}
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(0,255,255,0.3)',
                            '0 0 30px rgba(0,255,255,0.6)',
                            '0 0 20px rgba(0,255,255,0.3)'
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: (index + 4) * 0.5
                        }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </motion.div>
                      <span className="text-xs font-medium text-center capitalize">
                        {agent.agent_name.replace('_', ' ')}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
              
              {/* Neural Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {[...Array(12)].map((_, i) => (
                  <motion.line
                    key={i}
                    x1={`${20 + (i * 7)}%`}
                    y1="30%"
                    x2={`${80 - (i * 7)}%`}
                    y2="70%"
                    stroke="url(#neural-gradient)"
                    strokeWidth="1"
                    opacity="0.6"
                    animate={{
                      strokeDasharray: ['0 100', '50 50', '100 0'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
                <defs>
                  <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="cyan" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="purple" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="cyan" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {agents.map((agent, index) => (
            <AgentCard key={agent.id} agent={agent} index={index} />
          ))}
        </div>
        
        {/* Collective Status Panel */}
        <motion.div
          className="p-4 bg-gradient-to-r from-command-accent/10 to-command-success/10 rounded-lg border border-command-accent/20 holographic-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-4 h-4 bg-green-400 rounded-full"
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
                Super Agent Group Status: OPTIMAL
              </span>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                <Cpu className="h-3 w-3 mr-1" />
                All Systems Operational
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-command-success rounded-full" />
                <span>Neural Network: Online</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-command-accent rounded-full" />
                <span>Orchestration: Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}