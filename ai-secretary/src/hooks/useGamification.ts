import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTasks } from '@/hooks/useTasks'
import toast from 'react-hot-toast'

// Achievement definitions
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'orchestration' | 'complexity' | 'mastery' | 'efficiency'
  requirement: number
  type: 'task_count' | 'agent_types' | 'complexity_points' | 'consecutive_successes'
  unlockedAt?: Date
  isUnlocked: boolean
  points: number
}

export interface UserLevel {
  level: number
  title: string
  pointsRequired: number
  pointsToNext: number
  description: string
  color: string
}

export interface GamificationStats {
  totalPoints: number
  currentLevel: UserLevel
  achievements: Achievement[]
  taskComplexityScore: number
  agentMasteryScore: number
  orchestrationStreak: number
  weeklyProgress: number
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'task_whisperer',
    title: 'Task Whisperer',
    description: 'Complete your first AI-routed task',
    icon: '🧠',
    category: 'orchestration',
    requirement: 1,
    type: 'task_count',
    isUnlocked: false,
    points: 50
  },
  {
    id: 'agent_commander',
    title: 'Agent Commander',
    description: 'Complete 10+ agent orchestrations',
    icon: '🎯',
    category: 'orchestration',
    requirement: 10,
    type: 'task_count',
    isUnlocked: false,
    points: 200
  },
  {
    id: 'ai_strategist',
    title: 'AI Strategist',
    description: 'Complete complex multi-step tasks',
    icon: '🚀',
    category: 'complexity',
    requirement: 1000,
    type: 'complexity_points',
    isUnlocked: false,
    points: 500
  },
  {
    id: 'super_agent_master',
    title: 'Super Agent Master',
    description: 'Complete 100+ AI interactions',
    icon: '🏆',
    category: 'mastery',
    requirement: 100,
    type: 'task_count',
    isUnlocked: false,
    points: 1000
  },
  {
    id: 'neural_network_navigator',
    title: 'Neural Network Navigator',
    description: 'Use all available AI agents',
    icon: '🧩',
    category: 'mastery',
    requirement: 4,
    type: 'agent_types',
    isUnlocked: false,
    points: 300
  },
  {
    id: 'efficiency_expert',
    title: 'Efficiency Expert',
    description: 'Complete 10 tasks with 100% success rate',
    icon: '⚡',
    category: 'efficiency',
    requirement: 10,
    type: 'consecutive_successes',
    isUnlocked: false,
    points: 400
  }
]

const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    title: 'AI Novice',
    pointsRequired: 0,
    pointsToNext: 200,
    description: 'Learning the basics of AI orchestration',
    color: 'from-gray-500 to-gray-600'
  },
  {
    level: 2,
    title: 'Neural Explorer',
    pointsRequired: 200,
    pointsToNext: 500,
    description: 'Understanding AI agent capabilities',
    color: 'from-blue-500 to-blue-600'
  },
  {
    level: 3,
    title: 'AI Expert',
    pointsRequired: 700,
    pointsToNext: 800,
    description: 'Mastering complex AI interactions',
    color: 'from-green-500 to-green-600'
  },
  {
    level: 4,
    title: 'Agent Master',
    pointsRequired: 1500,
    pointsToNext: 1000,
    description: 'Expert in multi-agent orchestration',
    color: 'from-purple-500 to-purple-600'
  },
  {
    level: 5,
    title: 'Super Agent',
    pointsRequired: 2500,
    pointsToNext: 0,
    description: 'Ultimate AI orchestration mastery',
    color: 'from-yellow-500 to-orange-600'
  }
]

function calculateTaskComplexity(taskContent: string): number {
  const complexityFactors = {
    length: Math.min(taskContent.length / 100, 10),
    keywords: ['analyze', 'process', 'generate', 'complex', 'multi-step'].reduce(
      (score, keyword) => score + (taskContent.toLowerCase().includes(keyword) ? 20 : 0),
      0
    ),
    questions: (taskContent.match(/\?/g) || []).length * 15,
    requirements: (taskContent.match(/\d+\./g) || []).length * 10
  }
  
  return Math.min(
    complexityFactors.length + 
    complexityFactors.keywords + 
    complexityFactors.questions + 
    complexityFactors.requirements,
    100
  )
}

export function useGamification() {
  const { user } = useAuth()
  const { tasks } = useTasks()
  const [gamificationData, setGamificationData] = useState<GamificationStats | null>(null)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  // Calculate gamification stats from task data
  const stats = useMemo(() => {
    if (!tasks.length) {
      return {
        totalPoints: 0,
        currentLevel: USER_LEVELS[0],
        achievements: ACHIEVEMENTS.map(a => ({ ...a, isUnlocked: false })),
        taskComplexityScore: 0,
        agentMasteryScore: 0,
        orchestrationStreak: 0,
        weeklyProgress: 0,
        USER_LEVELS,
        newAchievements: []
      }
    }

    const completedTasks = tasks.filter(t => t.status === 'completed')
    const uniqueAgents = new Set(completedTasks.map(t => t.selected_agent))
    const totalComplexity = tasks.reduce((sum, task) => 
      sum + calculateTaskComplexity(task.task_content), 0
    )

    // Calculate consecutive successes (streak)
    let streak = 0
    const sortedTasks = [...tasks].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    for (const task of sortedTasks) {
      if (task.status === 'completed') streak++
      else break
    }

    // Calculate weekly progress
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const weeklyTasks = tasks.filter(t => 
      new Date(t.created_at) > oneWeekAgo
    ).length

    // Check achievements
    const updatedAchievements = ACHIEVEMENTS.map(achievement => {
      let isUnlocked = false
      
      switch (achievement.type) {
        case 'task_count':
          isUnlocked = completedTasks.length >= achievement.requirement
          break
        case 'agent_types':
          isUnlocked = uniqueAgents.size >= achievement.requirement
          break
        case 'complexity_points':
          isUnlocked = totalComplexity >= achievement.requirement
          break
        case 'consecutive_successes':
          isUnlocked = streak >= achievement.requirement
          break
      }
      
      return { ...achievement, isUnlocked }
    })

    // Calculate total points
    const totalPoints = updatedAchievements
      .filter(a => a.isUnlocked)
      .reduce((sum, a) => sum + a.points, 0) + (completedTasks.length * 10)

    // Determine current level
    const currentLevel = USER_LEVELS.reduce((current, level) => 
      totalPoints >= level.pointsRequired ? level : current
    )

    return {
      totalPoints,
      currentLevel,
      achievements: updatedAchievements,
      taskComplexityScore: Math.round(totalComplexity / Math.max(tasks.length, 1)),
      agentMasteryScore: uniqueAgents.size * 25,
      orchestrationStreak: streak,
      weeklyProgress: weeklyTasks,
      USER_LEVELS,
      newAchievements: []
    }
  }, [tasks])

  // Check for newly unlocked achievements
  useEffect(() => {
    if (!gamificationData) {
      setGamificationData(stats)
      return
    }

    const newlyUnlocked = stats.achievements.filter(achievement => 
      achievement.isUnlocked && 
      !gamificationData.achievements.find(prev => 
        prev.id === achievement.id && prev.isUnlocked
      )
    )

    if (newlyUnlocked.length > 0) {
      setNewAchievements(newlyUnlocked)
      newlyUnlocked.forEach(achievement => {
        toast.success(
          `Achievement Unlocked: ${achievement.title}!`,
          {
            duration: 5000,
            icon: achievement.icon,
          }
        )
      })
    }

    setGamificationData(stats)
  }, [stats, gamificationData])

  const clearNewAchievements = () => {
    setNewAchievements([])
  }

  return {
    stats: gamificationData || stats,
    newAchievements,
    clearNewAchievements,
    calculateTaskComplexity,
    USER_LEVELS
  }
}

export default useGamification