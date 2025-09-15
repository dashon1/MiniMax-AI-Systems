import { useAgents } from '@/hooks/useTasks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Zap, Lightbulb, Building2, Activity } from 'lucide-react'
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
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden"
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientColor} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg capitalize">
                {agent.agent_name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                  {agent.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {agent.pricing_model.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {agent.description}
          </p>
          
          <div>
            <h4 className="text-xs font-medium text-foreground mb-2">Specializations</h4>
            <div className="flex flex-wrap gap-1">
              {agent.capability_keywords.slice(0, 6).map((keyword: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {agent.capability_keywords.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.capability_keywords.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AgentOverview() {
  const { agents, loading } = useAgents()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Agent Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          AI Agent Overview
        </CardTitle>
        <CardDescription>
          {agents.length} specialized AI agents ready to handle your tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}