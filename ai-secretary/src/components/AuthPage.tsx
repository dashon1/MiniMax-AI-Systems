import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CommandCenterBackground } from '@/components/ui/command-center-background'
import { Loader2, Mail, Lock, Zap, Bot, Shield, Sparkles, Target, Brain } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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
    <div className="min-h-screen bg-command-gradient relative flex items-center justify-center p-4 overflow-hidden">
      {/* Command Center Background */}
      <CommandCenterBackground variant="holographic" color="command" className="absolute inset-0" />
      
      {/* Neural Grid Pattern */}
      <div className="absolute inset-0 command-grid opacity-30" />
      
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="p-3 bg-gradient-to-br from-command-accent to-command-success rounded-xl shadow-2xl"
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
              <Bot className="h-10 w-10 text-white" />
            </motion.div>
            <div className="text-left">
              <h1 className="text-4xl font-bold command-title mb-2">
                AI Super Agent Group
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-command-accent" />
                Strongest Agent Workforce in the Industry
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-command-success" />
              <span className="text-command-success font-medium">Unified Collective</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-command-accent" />
              <span className="text-command-accent font-medium">Neural Orchestration</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-command-warning" />
              <span className="text-command-warning font-medium">Maximum Security</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-20 mt-32"
      >
        <Card className="w-full max-w-md holographic-border bg-card/90 backdrop-blur-md shadow-2xl">
          <CommandCenterBackground variant="subtle" color="command" />
          
          <CardHeader className="text-center relative">
            <motion.div
              className="mx-auto mb-4 p-3 bg-gradient-to-br from-command-accent to-command-success rounded-lg w-fit"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Shield className="h-6 w-6 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              Command Center Access
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="h-5 w-5 text-command-accent" />
              </motion.div>
            </CardTitle>
            <CardDescription>
              Enter the most powerful AI agent orchestration platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-command-accent/20 data-[state=active]:text-command-accent"
                >
                  Agent Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-command-success/20 data-[state=active]:text-command-success"
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
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-command-accent" />
                      <Input
                        type="email"
                        placeholder="Agent Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 holographic-border bg-card/50 backdrop-blur-sm focus:border-command-accent"
                        required
                      />
                    </motion.div>
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-command-accent" />
                      <Input
                        type="password"
                        placeholder="Security Passphrase"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 holographic-border bg-card/50 backdrop-blur-sm focus:border-command-accent"
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
                      className="w-full bg-gradient-to-r from-command-accent to-command-success hover:from-command-accent/80 hover:to-command-success/80 text-white font-semibold py-2.5" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> 
                          Accessing Command Center...
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
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-command-success" />
                      <Input
                        type="email"
                        placeholder="Agent Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 holographic-border bg-card/50 backdrop-blur-sm focus:border-command-success"
                        required
                      />
                    </motion.div>
                    <motion.div 
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-command-success" />
                      <Input
                        type="password"
                        placeholder="Create Security Passphrase (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 holographic-border bg-card/50 backdrop-blur-sm focus:border-command-success"
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
                      className="w-full bg-gradient-to-r from-command-success to-command-accent hover:from-command-success/80 hover:to-command-accent/80 text-white font-semibold py-2.5" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> 
                          Creating Agent Profile...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          Join Super Agent Group
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Features showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-6 p-4 bg-gradient-to-r from-command-accent/5 to-command-success/5 rounded-lg border border-command-accent/20"
            >
              <div className="text-xs text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-command-success rounded-full animate-pulse" />
                    <span>Unified Collective</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-command-accent rounded-full animate-pulse" />
                    <span>Neural Orchestration</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Experience the most powerful AI agent workforce with transparent processes and supreme capability
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-command-accent/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}