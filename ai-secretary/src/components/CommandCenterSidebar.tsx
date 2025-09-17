import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Mail, Lock, Shield, Bot, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export function CommandCenterSidebar() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      toast.success('Welcome to the Command Center!')
    } catch (error: any) {
      toast.error(error.message || 'Access denied')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await signUp(email, password)
      if (error) throw error
      toast.success('Agent credentials sent to your secure channel!')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const shouldExpand = isExpanded || isHovered

  return (
    <div 
      className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative"
        initial={{ x: 280 }}
        animate={{ x: shouldExpand ? 0 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Enhanced Expand/Collapse Tab */}
        <motion.div
          className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 z-10"
          whileHover={{ scale: 1.05 }}
        >
          {/* Tab Background with Glow */}
          <motion.div
            className="relative w-12 h-20 bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-md rounded-l-xl border border-blue-400/30 shadow-2xl cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            animate={{
              boxShadow: [
                '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(147, 51, 234, 0.2)',
                '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(147, 51, 234, 0.3)',
                '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(147, 51, 234, 0.2)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {/* Neural Grid Pattern on Tab */}
            <div 
              className="absolute inset-0 rounded-l-xl opacity-30"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '8px 8px'
              }}
            />
            
            {/* Tab Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-white">
              <motion.div
                animate={{ rotate: shouldExpand ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className="mb-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.div>
              
              {/* Command Access Text */}
              <div className="transform -rotate-90 text-xs font-bold tracking-wider whitespace-nowrap">
                COMMAND
              </div>
              
              {/* Pulsing Indicator */}
              <motion.div
                className="w-2 h-2 bg-green-400 rounded-full mt-2"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Main Command Center Panel */}
        <Card className="w-96 bg-black/95 backdrop-blur-md border border-blue-500/40 shadow-2xl overflow-hidden">
          {/* Enhanced Background Effect */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(255,0,128,0.08) 50%, rgba(0,255,136,0.08) 100%)',
            }}
            animate={{
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Neural Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
          
          <CardHeader className="text-center relative z-10 pb-4">
            <motion.div
              className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl w-fit"
              whileHover={{ scale: 1.1, rotate: 5 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(59, 130, 246, 0.4)',
                  '0 0 40px rgba(147, 51, 234, 0.6)',
                  '0 0 20px rgba(59, 130, 246, 0.4)'
                ]
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                hover: { type: 'spring', stiffness: 300 }
              }}
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3 mb-2">
              Command Center Access
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5], rotate: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="h-5 w-5 text-blue-400" />
              </motion.div>
            </CardTitle>
            
            <CardDescription className="text-gray-300 text-base">
              Enter the AI Neural Orchestration Platform
            </CardDescription>
            
            {/* Status Banner */}
            <motion.div
              className="mt-3 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-400/30"
              animate={{
                borderColor: ['rgba(34, 197, 94, 0.3)', 'rgba(59, 130, 246, 0.3)', 'rgba(34, 197, 94, 0.3)']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="flex items-center justify-center gap-2 text-sm">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-green-400 font-medium">Neural Network Online</span>
              </div>
            </motion.div>
          </CardHeader>
          
          <CardContent className="relative z-10 pt-0">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/60 backdrop-blur-sm border border-gray-600/30">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-300 data-[state=active]:border-blue-400/50 transition-all duration-300"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Agent Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-300 data-[state=active]:border-purple-400/50 transition-all duration-300"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Join Forces
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-4">
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-blue-400" />
                      <Input
                        type="email"
                        placeholder="Agent Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 py-3 bg-gray-800/60 border-blue-500/40 focus:border-blue-400 text-white placeholder-gray-400 rounded-lg backdrop-blur-sm"
                        required
                      />
                    </motion.div>
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-blue-400" />
                      <Input
                        type="password"
                        placeholder="Security Passphrase"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 py-3 bg-gray-800/60 border-blue-500/40 focus:border-blue-400 text-white placeholder-gray-400 rounded-lg backdrop-blur-sm"
                        required
                      />
                    </motion.div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 text-lg rounded-lg shadow-lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin" /> 
                          Accessing Neural Network...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5" />
                          Enter Command Center
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-4">
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-purple-400" />
                      <Input
                        type="email"
                        placeholder="Agent Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 py-3 bg-gray-800/60 border-purple-500/40 focus:border-purple-400 text-white placeholder-gray-400 rounded-lg backdrop-blur-sm"
                        required
                      />
                    </motion.div>
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-purple-400" />
                      <Input
                        type="password"
                        placeholder="Create Security Passphrase (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 py-3 bg-gray-800/60 border-purple-500/40 focus:border-purple-400 text-white placeholder-gray-400 rounded-lg backdrop-blur-sm"
                        required
                        minLength={6}
                      />
                    </motion.div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 text-lg rounded-lg shadow-lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin" /> 
                          Creating Agent Profile...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5" />
                          Join Neural Collective
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Enhanced Status Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30"
            >
              <div className="text-sm text-center space-y-3">
                <div className="flex items-center justify-center gap-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs">Secured Connection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                    <span className="text-xs">AI Network Active</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Advanced AI orchestration platform with neural network intelligence and secure agent authentication
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}