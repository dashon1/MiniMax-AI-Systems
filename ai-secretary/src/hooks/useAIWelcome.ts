import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTasks } from '@/hooks/useTasks'
import { useGamification } from '@/hooks/useGamification'

interface WelcomeMessage {
  id: string
  text: string
  type: 'greeting' | 'achievement' | 'suggestion' | 'motivation'
  priority: number
  conditions?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening'
    lastActivity?: number // hours since last activity
    achievements?: string[]
    taskCount?: number
  }
}

interface AIGreeting {
  message: string
  highlight?: {
    text: string
    type: 'achievement' | 'progress' | 'suggestion'
  }
  suggestion?: {
    title: string
    description: string
    action: string
  }
}

const WELCOME_MESSAGES: WelcomeMessage[] = [
  // Greeting messages
  {
    id: 'first_time',
    text: 'Welcome to your AI Super Agent platform! Let\'s start orchestrating some intelligent tasks.',
    type: 'greeting',
    priority: 100,
    conditions: { taskCount: 0 }
  },
  {
    id: 'morning_greeting',
    text: 'Good morning! Your AI agents are ready to tackle today\'s challenges.',
    type: 'greeting',
    priority: 80,
    conditions: { timeOfDay: 'morning' }
  },
  {
    id: 'afternoon_greeting',
    text: 'Good afternoon! How can our AI agents boost your productivity today?',
    type: 'greeting',
    priority: 80,
    conditions: { timeOfDay: 'afternoon' }
  },
  {
    id: 'evening_greeting',
    text: 'Good evening! Time to review your AI-powered accomplishments.',
    type: 'greeting',
    priority: 80,
    conditions: { timeOfDay: 'evening' }
  },
  
  // Achievement highlights
  {
    id: 'first_achievement',
    text: 'Congratulations! You\'ve unlocked your first AI achievement.',
    type: 'achievement',
    priority: 90,
    conditions: { achievements: ['task_whisperer'] }
  },
  {
    id: 'level_up',
    text: 'Amazing! You\'ve leveled up your AI mastery. Your neural network understanding is growing.',
    type: 'achievement',
    priority: 95
  },
  {
    id: 'streak_achievement',
    text: 'Impressive streak! Your AI orchestration skills are reaching expert level.',
    type: 'achievement',
    priority: 85
  },
  
  // Intelligent suggestions
  {
    id: 'try_complex_task',
    text: 'Ready for a challenge? Try our advanced document analysis AI for complex tasks.',
    type: 'suggestion',
    priority: 70,
    conditions: { taskCount: 5 }
  },
  {
    id: 'explore_agents',
    text: 'Discover the power of multi-agent orchestration - each AI has unique strengths.',
    type: 'suggestion',
    priority: 75,
    conditions: { taskCount: 2 }
  },
  {
    id: 'analytics_suggestion',
    text: 'Check out your analytics dashboard to see your AI productivity insights.',
    type: 'suggestion',
    priority: 65,
    conditions: { taskCount: 10 }
  },
  
  // Motivational messages
  {
    id: 'power_user',
    text: 'You\'re becoming an AI power user! Your task orchestration skills are impressive.',
    type: 'motivation',
    priority: 60,
    conditions: { taskCount: 25 }
  },
  {
    id: 'consistent_user',
    text: 'Your consistent AI interaction is building real expertise. Keep exploring!',
    type: 'motivation',
    priority: 55,
    conditions: { lastActivity: 24 }
  },
  {
    id: 'welcome_back',
    text: 'Welcome back! Your AI agents missed orchestrating tasks with you.',
    type: 'motivation',
    priority: 50,
    conditions: { lastActivity: 72 }
  }
]

const AI_SUGGESTIONS = [
  {
    title: 'Neural Document Analysis',
    description: 'Upload documents for AI-powered analysis and insights',
    action: 'Try Document AI'
  },
  {
    title: 'Multi-Agent Orchestration',
    description: 'Combine multiple AI agents for complex problem solving',
    action: 'Explore Agents'
  },
  {
    title: 'Intelligent Task Routing',
    description: 'Let our AI route your tasks to the most suitable agent',
    action: 'Smart Routing'
  },
  {
    title: 'AI Performance Analytics',
    description: 'Discover insights about your AI interaction patterns',
    action: 'View Analytics'
  },
  {
    title: 'Advanced Processing',
    description: 'Experience cutting-edge AI capabilities for complex tasks',
    action: 'Try Advanced AI'
  }
]

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function getHoursSinceLastActivity(lastActivityDate?: string): number {
  if (!lastActivityDate) return 999 // No activity
  const now = new Date().getTime()
  const last = new Date(lastActivityDate).getTime()
  return (now - last) / (1000 * 60 * 60)
}

export function useAIWelcome() {
  const { user } = useAuth()
  const { tasks } = useTasks()
  const { stats } = useGamification()
  const [currentGreeting, setCurrentGreeting] = useState<AIGreeting | null>(null)
  const [rotationIndex, setRotationIndex] = useState(0)

  // Generate AI greeting based on user context
  const generateAIGreeting = (): AIGreeting => {
    const taskCount = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const timeOfDay = getTimeOfDay()
    const lastTask = tasks[0]
    const hoursSinceLastActivity = lastTask ? getHoursSinceLastActivity(lastTask.created_at) : 999
    const unlockedAchievements = stats.achievements.filter(a => a.isUnlocked)
    
    // Find the highest priority applicable message
    const applicableMessages = WELCOME_MESSAGES.filter(msg => {
      if (!msg.conditions) return true
      
      const conditions = msg.conditions
      
      // Check time of day
      if (conditions.timeOfDay && conditions.timeOfDay !== timeOfDay) {
        return false
      }
      
      // Check task count
      if (conditions.taskCount !== undefined && taskCount < conditions.taskCount) {
        return false
      }
      
      // Check last activity
      if (conditions.lastActivity !== undefined && hoursSinceLastActivity < conditions.lastActivity) {
        return false
      }
      
      // Check achievements
      if (conditions.achievements) {
        const hasAchievements = conditions.achievements.some(achievementId =>
          unlockedAchievements.some(a => a.id === achievementId)
        )
        if (!hasAchievements) return false
      }
      
      return true
    })
    
    // Sort by priority and pick the highest
    const selectedMessage = applicableMessages.sort((a, b) => b.priority - a.priority)[0]
    
    // Generate highlight based on recent activity
    let highlight = undefined
    const recentAchievements = stats.achievements.filter(a => a.isUnlocked)
    if (recentAchievements.length > 0 && completedTasks > 0) {
      const latestAchievement = recentAchievements[recentAchievements.length - 1]
      highlight = {
        text: `Achievement: ${latestAchievement.title}`,
        type: 'achievement' as const
      }
    } else if (completedTasks > 0) {
      highlight = {
        text: `${completedTasks} tasks completed this week!`,
        type: 'progress' as const
      }
    } else if (taskCount === 0) {
      highlight = {
        text: 'Ready to start your AI journey?',
        type: 'suggestion' as const
      }
    }
    
    // Generate intelligent suggestion
    const suggestion = AI_SUGGESTIONS[rotationIndex % AI_SUGGESTIONS.length]
    
    return {
      message: selectedMessage?.text || 'Welcome to your AI Super Agent platform!',
      highlight,
      suggestion
    }
  }

  // Update greeting periodically
  useEffect(() => {
    const updateGreeting = () => {
      setCurrentGreeting(generateAIGreeting())
    }
    
    updateGreeting()
    
    // Update every 30 seconds for dynamic behavior
    const interval = setInterval(() => {
      setRotationIndex(prev => prev + 1)
      updateGreeting()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [tasks, stats, rotationIndex])

  // Activity recognition patterns
  const getActivityPattern = () => {
    const recentTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at)
      const daysDiff = (new Date().getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 7
    })
    
    if (recentTasks.length >= 20) return 'power_user'
    if (recentTasks.length >= 10) return 'active_user'
    if (recentTasks.length >= 5) return 'regular_user'
    if (recentTasks.length >= 1) return 'new_user'
    return 'visitor'
  }

  const getMotivationalMessage = () => {
    const pattern = getActivityPattern()
    const messages = {
      power_user: 'You\'re mastering AI orchestration! Your expertise is showing.',
      active_user: 'Great momentum with your AI interactions! Keep it up.',
      regular_user: 'You\'re getting the hang of AI agent coordination.',
      new_user: 'Welcome to the world of AI super agents!',
      visitor: 'Ready to discover the power of AI orchestration?'
    }
    return messages[pattern]
  }

  return {
    currentGreeting,
    activityPattern: getActivityPattern(),
    motivationalMessage: getMotivationalMessage(),
    taskStats: {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      thisWeek: tasks.filter(t => {
        const taskDate = new Date(t.created_at)
        const daysDiff = (new Date().getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 7
      }).length
    },
    refreshGreeting: () => setCurrentGreeting(generateAIGreeting())
  }
}

export default useAIWelcome