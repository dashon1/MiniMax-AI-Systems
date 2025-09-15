import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { 
  Brain, 
  Search, 
  BarChart3, 
  TrendingUp, 
  Database, 
  Zap,
  PenTool,
  Palette,
  Video,
  FileText,
  Building2,
  Target,
  PieChart,
  Briefcase,
  Code,
  Settings,
  Workflow,
  Server,
  LineChart,
  FileSpreadsheet,
  Bot,
  Cpu,
  Activity,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AgentCollectiveSection {
  id: string
  title: string
  description: string
  icon: any
  color: string
  gradient: string
  capabilities: string[]
  powerLevel: number
  activeAgents: number
  specializations: { name: string; level: number }[]
}

const agentCollectives: AgentCollectiveSection[] = [
  {
    id: 'research',
    title: 'Research & Intelligence Collective',
    description: 'Elite intelligence gathering and market analysis specialists delivering comprehensive insights',
    icon: Brain,
    color: 'command-accent',
    gradient: 'from-blue-500 to-cyan-400',
    powerLevel: 95,
    activeAgents: 8,
    capabilities: [
      'Market Intelligence', 'Competitive Analysis', 'Data Mining', 'Trend Forecasting',
      'Research Synthesis', 'Intelligence Reports', 'Strategic Insights', 'Industry Analysis'
    ],
    specializations: [
      { name: 'Market Research', level: 98 },
      { name: 'Competitive Intelligence', level: 96 },
      { name: 'Data Analysis', level: 94 },
      { name: 'Trend Analysis', level: 92 }
    ]
  },
  {
    id: 'creative',
    title: 'Creative & Content Collective',
    description: 'Master creators delivering exceptional content across all mediums and formats',
    icon: PenTool,
    color: 'command-success',
    gradient: 'from-green-500 to-emerald-400',
    powerLevel: 93,
    activeAgents: 12,
    capabilities: [
      'Content Creation', 'Visual Design', 'Video Production', 'Copywriting',
      'Brand Development', 'Creative Strategy', 'Social Media', 'Presentation Design'
    ],
    specializations: [
      { name: 'Content Writing', level: 97 },
      { name: 'Visual Design', level: 95 },
      { name: 'Video Production', level: 91 },
      { name: 'Brand Strategy', level: 89 }
    ]
  },
  {
    id: 'business',
    title: 'Business & Strategy Collective',
    description: 'Strategic masterminds driving business excellence and organizational transformation',
    icon: Building2,
    color: 'command-warning',
    gradient: 'from-orange-500 to-amber-400',
    powerLevel: 96,
    activeAgents: 10,
    capabilities: [
      'Strategic Planning', 'Business Analysis', 'Financial Modeling', 'Operations Optimization',
      'Decision Support', 'Risk Assessment', 'Performance Analytics', 'Growth Strategy'
    ],
    specializations: [
      { name: 'Strategic Planning', level: 99 },
      { name: 'Business Analysis', level: 97 },
      { name: 'Financial Modeling', level: 94 },
      { name: 'Operations', level: 92 }
    ]
  },
  {
    id: 'technical',
    title: 'Technical & Development Collective',
    description: 'Elite engineering minds building tomorrow\'s solutions with cutting-edge technology',
    icon: Code,
    color: 'command-danger',
    gradient: 'from-red-500 to-pink-400',
    powerLevel: 98,
    activeAgents: 15,
    capabilities: [
      'Software Development', 'System Architecture', 'API Integration', 'Database Design',
      'DevOps Automation', 'Security Implementation', 'Performance Optimization', 'Code Review'
    ],
    specializations: [
      { name: 'Full-Stack Development', level: 99 },
      { name: 'System Architecture', level: 97 },
      { name: 'DevOps & Automation', level: 95 },
      { name: 'Security', level: 93 }
    ]
  },
  {
    id: 'data',
    title: 'Data & Automation Collective',
    description: 'Data science virtuosos transforming information into intelligent automated workflows',
    icon: Database,
    color: 'purple-500',
    gradient: 'from-purple-500 to-violet-400',
    powerLevel: 94,
    activeAgents: 11,
    capabilities: [
      'Data Processing', 'Machine Learning', 'Workflow Automation', 'ETL Pipelines',
      'Predictive Analytics', 'Process Optimization', 'Report Generation', 'Data Visualization'
    ],
    specializations: [
      { name: 'Data Processing', level: 98 },
      { name: 'ML & AI', level: 96 },
      { name: 'Automation', level: 94 },
      { name: 'Analytics', level: 92 }
    ]
  }
]

function CollectiveCard({ collective, index }: { collective: AgentCollectiveSection; index: number }) {
  const Icon = collective.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative group"
    >
      <Card className="h-full relative overflow-hidden border-2 border-transparent hover:border-current transition-all duration-300">
        <CommandCenterBackground 
          variant="dynamic" 
          color={collective.id === 'research' ? 'blue' : 
                collective.id === 'creative' ? 'green' :
                collective.id === 'business' ? 'orange' :
                collective.id === 'technical' ? 'red' : 'purple'} 
        />
        
        {/* Power Level Indicator */}
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-bold border-2 px-2 py-1",
              collective.powerLevel >= 95 ? "agent-power-high border-green-400 text-green-400" :
              collective.powerLevel >= 90 ? "agent-power-medium border-blue-400 text-blue-400" :
              "agent-power-active border-red-400 text-red-400"
            )}
          >
            POWER: {collective.powerLevel}%
          </Badge>
        </div>
        
        <CardHeader className="pb-4 relative">
          <div className="flex items-start gap-4">
            <motion.div 
              className={cn(
                "p-3 rounded-xl shadow-lg relative overflow-hidden",
                `bg-gradient-to-br ${collective.gradient}`
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
              <Icon className="h-8 w-8 text-white relative z-10" />
            </motion.div>
            
            <div className="flex-1">
              <CardTitle className="text-xl mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {collective.title}
                </span>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
              </CardTitle>
              
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {collective.activeAgents} Active Agents
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-xs bg-green-500/10 text-green-400 border-green-500/20"
                >
                  <Bot className="h-3 w-3 mr-1" />
                  Collective Mode
                </Badge>
              </div>
              
              <CardDescription className="text-sm leading-relaxed">
                {collective.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          {/* Specializations */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Core Specializations
            </h4>
            <div className="space-y-2">
              {collective.specializations.map((spec, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{spec.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          spec.level >= 95 ? "bg-green-400" :
                          spec.level >= 90 ? "bg-blue-400" : "bg-orange-400"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${spec.level}%` }}
                        transition={{ delay: index * 0.1 + i * 0.05, duration: 1 }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-8">
                      {spec.level}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Capabilities */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Collective Capabilities
            </h4>
            <div className="flex flex-wrap gap-1">
              {collective.capabilities.slice(0, 6).map((capability, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + i * 0.02 }}
                >
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {capability}
                  </Badge>
                </motion.div>
              ))}
              {collective.capabilities.length > 6 && (
                <Badge variant="outline" className="text-xs bg-muted/30">
                  +{collective.capabilities.length - 6} more
                </Badge>
              )}
            </div>
          </div>
          
          {/* Action Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className={cn(
                "w-full text-sm",
                `bg-gradient-to-r ${collective.gradient} hover:opacity-90 text-white shadow-lg`
              )}
            >
              <Target className="h-4 w-4 mr-2" />
              Deploy {collective.title.split(' ')[0]} Collective
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface SuperAgentCollectivesProps {
  className?: string
}

export function SuperAgentCollectives({ className }: SuperAgentCollectivesProps) {
  const totalAgents = agentCollectives.reduce((sum, collective) => sum + collective.activeAgents, 0)
  const averagePower = Math.round(agentCollectives.reduce((sum, collective) => sum + collective.powerLevel, 0) / agentCollectives.length)
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <Card className="relative overflow-hidden border-green-500/30">
          <CommandCenterBackground variant="subtle" color="green" />
          <CardContent className="p-4 text-center relative">
            <div className="text-3xl font-bold text-green-400">{totalAgents}</div>
            <div className="text-sm text-muted-foreground">Active Agents</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-blue-500/30">
          <CommandCenterBackground variant="subtle" color="blue" />
          <CardContent className="p-4 text-center relative">
            <div className="text-3xl font-bold text-blue-400">{averagePower}%</div>
            <div className="text-sm text-muted-foreground">Collective Power</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-red-500/30">
          <CommandCenterBackground variant="subtle" color="red" />
          <CardContent className="p-4 text-center relative">
            <div className="text-3xl font-bold text-red-400">{agentCollectives.length}</div>
            <div className="text-sm text-muted-foreground">Specialized Groups</div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Collective Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {agentCollectives.map((collective, index) => (
          <CollectiveCard key={collective.id} collective={collective} index={index} />
        ))}
      </div>
    </div>
  )
}