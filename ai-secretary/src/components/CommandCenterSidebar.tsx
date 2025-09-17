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

  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50">
      <motion.div
        className="relative"
        initial={{ x: 300 }}
        animate={{ x: isExpanded ? 0 : 250 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Expand/Collapse Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-l-lg flex items-center justify-center hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </motion.div>
        </motion.button>

        {/* Main Card */}
        <Card className="w-80 bg-black/90 backdrop-blur-md border border-blue-500/30 shadow-2xl">
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(255,0,128,0.1) 100%)',
              filter: 'blur(1px)'
            }}
          />
          
          <CardHeader className="text-center relative z-10">
            <motion.div
              className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg w-fit"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Shield className="h-6 w-6 text-white" />
            </motion.div>
            <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              Command Center Access
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="h-4 w-4 text-blue-400" />
              </motion.div>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Enter the AI orchestration platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                >
                  Agent Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                >
                  Join Forces
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-3">
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        type="email"
                        placeholder="Agent Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-800/50 border-blue-500/30 focus:border-blue-400 text-white placeholder-gray-400"
                        required
                      />
                    </motion.div>
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                      <Input
                        type="password"
                        placeholder="Security Passphrase"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gray-800/50 border-blue-500/30 focus:border-blue-400 text-white placeholder-gray-400"
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
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2.5" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> 
                          Accessing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Enter Command Center
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-3">
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                      <Input
                        type="email"
                        placeholder="Agent Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-800/50 border-purple-500/30 focus:border-purple-400 text-white placeholder-gray-400"
                        required
                      />
                    </motion.div>
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                      <Input
                        type="password"
                        placeholder="Create Security Passphrase (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gray-800/50 border-purple-500/30 focus:border-purple-400 text-white placeholder-gray-400"
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
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2.5" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> 
                          Creating Profile...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          Join Forces
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Status indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20"
            >
              <div className="text-xs text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-gray-300">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Neural Network Online</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs">
                  Secured AI agent orchestration platform
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}