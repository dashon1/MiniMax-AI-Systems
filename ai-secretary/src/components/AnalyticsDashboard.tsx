import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, PieChart, TrendingUp, Activity, DollarSign, Users, CheckCircle2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTasks } from '@/hooks/useTasks'
import { useMemo } from 'react'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

export function AnalyticsDashboard() {
  const { theme } = useTheme()
  const { tasks } = useTasks()

  // Theme-aware colors
  const isDark = theme === 'dark'
  const colors = {
    primary: isDark ? '#3B82F6' : '#1D4ED8',
    secondary: isDark ? '#10B981' : '#059669',
    accent: isDark ? '#F59E0B' : '#D97706',
    danger: isDark ? '#EF4444' : '#DC2626',
    background: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    border: isDark ? '#374151' : '#E5E7EB',
  }

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!tasks.length) return null

    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const agentCounts = tasks.reduce((acc, task) => {
      acc[task.selected_agent] = (acc[task.selected_agent] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalCost = tasks.reduce((sum, task) => sum + task.estimated_cost, 0)
    const completionRate = tasks.length > 0 ? (statusCounts.completed || 0) / tasks.length * 100 : 0

    // Last 7 days activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    const dailyActivity = last7Days.map(date => {
      return tasks.filter(task => 
        task.created_at.startsWith(date)
      ).length
    })

    return {
      statusCounts,
      agentCounts,
      totalCost,
      completionRate,
      last7Days,
      dailyActivity,
      totalTasks: tasks.length
    }
  }, [tasks])

  if (!analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
          <CardDescription>Task analytics and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No task data available yet.</p>
            <p className="text-sm">Submit some tasks to see analytics!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Chart configurations
  const taskStatusData = {
    labels: ['Completed', 'Processing', 'Pending', 'Failed'],
    datasets: [
      {
        data: [
          analyticsData.statusCounts.completed || 0,
          analyticsData.statusCounts.processing || 0,
          analyticsData.statusCounts.pending || 0,
          analyticsData.statusCounts.failed || 0,
        ],
        backgroundColor: [
          colors.secondary,
          colors.primary,
          colors.accent,
          colors.danger,
        ],
        borderWidth: 0,
      },
    ],
  }

  const agentUsageData = {
    labels: Object.keys(analyticsData.agentCounts).map(agent => 
      agent.charAt(0).toUpperCase() + agent.slice(1)
    ),
    datasets: [
      {
        label: 'Tasks Handled',
        data: Object.values(analyticsData.agentCounts),
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        borderWidth: 1,
      },
    ],
  }

  const dailyActivityData = {
    labels: analyticsData.last7Days.map(date => 
      new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    ),
    datasets: [
      {
        label: 'Tasks Created',
        data: analyticsData.dailyActivity,
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.text,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: colors.border,
        },
        ticks: {
          color: colors.text,
        },
      },
      y: {
        grid: {
          color: colors.border,
        },
        ticks: {
          color: colors.text,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: colors.text,
          padding: 20,
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-primary" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{analyticsData.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analyticsData.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${analyticsData.totalCost.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{Object.keys(analyticsData.agentCounts).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Task Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Doughnut data={taskStatusData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Agent Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar data={agentUsageData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Details</CardTitle>
              <CardDescription>Detailed breakdown of agent usage and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Bar data={agentUsageData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Daily Activity Trends
              </CardTitle>
              <CardDescription>Task creation activity over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Line data={dailyActivityData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
