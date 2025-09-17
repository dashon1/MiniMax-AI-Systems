import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Zap, Clock, Mouse } from 'lucide-react'

interface PerformanceMetrics {
  frameRate: number
  memoryUsage: number
  mouseResponseTime: number
  jsExecutionTime: number
  renderTime: number
  domNodes: number
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 0,
    memoryUsage: 0,
    mouseResponseTime: 0,
    jsExecutionTime: 0,
    renderTime: 0,
    domNodes: 0
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const intervalRef = useRef<number>()
  const mouseTestRef = useRef<{ startTime: number; endTime: number }>()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        setIsVisible(!isVisible)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isVisible])

  const startMonitoring = () => {
    setIsMonitoring(true)
    
    const monitor = () => {
      const newMetrics: PerformanceMetrics = {
        frameRate: getFPS(),
        memoryUsage: getMemoryUsage(),
        mouseResponseTime: metrics.mouseResponseTime,
        jsExecutionTime: getJSExecutionTime(),
        renderTime: getRenderTime(),
        domNodes: document.querySelectorAll('*').length
      }
      
      setMetrics(newMetrics)
    }

    intervalRef.current = window.setInterval(monitor, 1000)
    monitor() // Initial measurement
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const getFPS = (): number => {
    let fps = 0
    let lastTime = performance.now()
    let frames = 0
    
    const measureFPS = () => {
      frames++
      const currentTime = performance.now()
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime))
        frames = 0
        lastTime = currentTime
      }
      if (isMonitoring) {
        requestAnimationFrame(measureFPS)
      }
    }
    
    requestAnimationFrame(measureFPS)
    return fps
  }

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / 1048576) // Convert to MB
    }
    return 0
  }

  const getJSExecutionTime = (): number => {
    const entries = performance.getEntriesByType('measure')
    if (entries.length > 0) {
      const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0)
      return Math.round(totalTime / entries.length)
    }
    return 0
  }

  const getRenderTime = (): number => {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return firstPaint ? Math.round(firstPaint.startTime) : 0
  }

  const testMouseResponse = () => {
    mouseTestRef.current = { startTime: performance.now(), endTime: 0 }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseTestRef.current && mouseTestRef.current.endTime === 0) {
        mouseTestRef.current.endTime = performance.now()
        const responseTime = mouseTestRef.current.endTime - mouseTestRef.current.startTime
        
        setMetrics(prev => ({
          ...prev,
          mouseResponseTime: Math.round(responseTime)
        }))
        
        document.removeEventListener('mousemove', handleMouseMove)
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    
    // Auto-remove listener after 5 seconds
    setTimeout(() => {
      document.removeEventListener('mousemove', handleMouseMove)
    }, 5000)
  }

  const getPerformanceScore = (): { score: number; status: string; color: string } => {
    let score = 100
    
    // Deduct points based on metrics
    if (metrics.frameRate < 30) score -= 20
    if (metrics.frameRate < 15) score -= 30
    if (metrics.memoryUsage > 100) score -= 15
    if (metrics.memoryUsage > 200) score -= 25
    if (metrics.mouseResponseTime > 50) score -= 10
    if (metrics.mouseResponseTime > 100) score -= 20
    if (metrics.domNodes > 5000) score -= 10
    if (metrics.domNodes > 10000) score -= 20
    
    score = Math.max(0, score)
    
    if (score >= 80) return { score, status: 'Excellent', color: 'text-green-500' }
    if (score >= 60) return { score, status: 'Good', color: 'text-yellow-500' }
    if (score >= 40) return { score, status: 'Poor', color: 'text-orange-500' }
    return { score, status: 'Critical', color: 'text-red-500' }
  }

  const optimizationTips = [
    'Reduce the number of re-renders by using React.memo',
    'Lazy load components that are not immediately visible',
    'Optimize images and use WebP format',
    'Minimize JavaScript bundle size',
    'Use CSS transforms instead of changing layout properties',
    'Debounce frequent operations like search input',
    'Remove unused dependencies and code'
  ]

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
          Press Ctrl+P for Performance Monitor
        </div>
      </div>
    )
  }

  const performanceScore = getPerformanceScore()

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-black/90 backdrop-blur-md border-purple-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`flex-1 ${isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitor
            </Button>
            <Button
              size="sm"
              onClick={testMouseResponse}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Test Mouse
            </Button>
          </div>
          
          {/* Performance Score */}
          <div className="text-center p-2 bg-gray-800/50 rounded">
            <div className={`text-2xl font-bold ${performanceScore.color}`}>
              {performanceScore.score}
            </div>
            <div className="text-xs text-gray-300">{performanceScore.status}</div>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-800/50 p-2 rounded">
              <div className="text-gray-400">FPS</div>
              <div className={`font-bold ${metrics.frameRate < 30 ? 'text-red-400' : 'text-green-400'}`}>
                {metrics.frameRate}
              </div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <div className="text-gray-400">Memory (MB)</div>
              <div className={`font-bold ${metrics.memoryUsage > 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                {metrics.memoryUsage}
              </div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <div className="text-gray-400">Mouse (ms)</div>
              <div className={`font-bold ${metrics.mouseResponseTime > 50 ? 'text-red-400' : 'text-green-400'}`}>
                {metrics.mouseResponseTime}
              </div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded">
              <div className="text-gray-400">DOM Nodes</div>
              <div className={`font-bold ${metrics.domNodes > 5000 ? 'text-yellow-400' : 'text-green-400'}`}>
                {metrics.domNodes}
              </div>
            </div>
          </div>
          
          {/* Quick Optimization Tips */}
          {performanceScore.score < 70 && (
            <div className="text-xs">
              <div className="text-yellow-400 font-medium mb-1">Optimization Tips:</div>
              <ul className="text-gray-300 space-y-1 max-h-24 overflow-y-auto">
                {optimizationTips.slice(0, 3).map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
