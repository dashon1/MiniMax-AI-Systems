import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface Subscription {
  id: number
  user_id: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  price_id?: string
  status: string
  plan_type: 'standard' | 'pro'
  current_credits: number
  credit_limit: number
  credits_used_this_month: number
  billing_cycle_start: string
  created_at: string
  updated_at: string
}

interface SubscriptionContextType {
  subscription: Subscription | null
  loading: boolean
  refreshSubscription: () => Promise<void>
  upgradeToProTier: () => Promise<void>
  useCredits: (amount: number) => Promise<boolean>
  getRemainingCredits: () => number
  getCreditUsagePercentage: () => number
  isProTier: () => boolean
  isNearCreditLimit: () => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('neural_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setSubscription(data as Subscription)
      } else {
        // Create default standard subscription for new users via edge function
        console.log('No subscription found, creating default subscription for user:', user.id)
        
        try {
          const { data: provisionResult, error: provisionError } = await supabase.functions.invoke('provision-user-subscription', {
            body: { user_id: user.id }
          })
          
          if (provisionError) {
            console.error('Failed to provision subscription via edge function:', provisionError)
            toast.error('Failed to set up your account. Please refresh the page.')
          } else if (provisionResult?.success && provisionResult?.data?.subscription) {
            console.log('Default subscription created successfully:', provisionResult.data.subscription.id)
            setSubscription(provisionResult.data.subscription as Subscription)
            toast.success('Welcome! Your account has been set up with 100 free credits.')
          } else {
            console.error('Unexpected response from subscription provisioning:', provisionResult)
            toast.error('Failed to set up your account. Please contact support.')
          }
        } catch (error) {
          console.error('Error during subscription provisioning:', error)
          toast.error('Failed to set up your account. Please refresh the page.')
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscription = async () => {
    await fetchSubscription()
  }

  const upgradeToProTier = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade')
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType: 'pro',
          customerEmail: user.email
        }
      })

      if (error) throw error

      if (data.data?.checkoutUrl) {
        toast.success('Redirecting to payment...')
        window.location.href = data.data.checkoutUrl
      } else {
        toast.error('Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Failed to create subscription')
    }
  }

  const useCredits = async (amount: number): Promise<boolean> => {
    if (!subscription || !user) {
      toast.error('No active subscription found')
      return false
    }

    const newCreditsUsed = subscription.credits_used_this_month + amount
    
    if (newCreditsUsed > subscription.credit_limit) {
      toast.error('Insufficient credits. Please upgrade your plan.')
      return false
    }

    try {
      const { error } = await supabase
        .from('neural_subscriptions')
        .update({ 
          credits_used_this_month: newCreditsUsed,
          current_credits: subscription.credit_limit - newCreditsUsed
        })
        .eq('id', subscription.id)

      if (error) throw error

      // Update local state
      setSubscription(prev => prev ? {
        ...prev,
        credits_used_this_month: newCreditsUsed,
        current_credits: prev.credit_limit - newCreditsUsed
      } : null)

      return true
    } catch (error) {
      console.error('Failed to use credits:', error)
      toast.error('Failed to process credit usage')
      return false
    }
  }

  const getRemainingCredits = (): number => {
    if (!subscription) return 0
    return subscription.credit_limit - subscription.credits_used_this_month
  }

  const getCreditUsagePercentage = (): number => {
    if (!subscription) return 0
    return Math.round((subscription.credits_used_this_month / subscription.credit_limit) * 100)
  }

  const isProTier = (): boolean => {
    return subscription?.plan_type === 'pro'
  }

  const isNearCreditLimit = (): boolean => {
    return getCreditUsagePercentage() >= 80
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  // Handle payment result
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscriptionStatus = urlParams.get('subscription')

    if (subscriptionStatus === 'success') {
      toast.success('🎉 Subscription upgraded successfully!')
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Refresh subscription after successful payment
      setTimeout(() => {
        fetchSubscription()
      }, 2000)
      
    } else if (subscriptionStatus === 'cancelled') {
      toast.error('Subscription upgrade cancelled')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const contextValue: SubscriptionContextType = {
    subscription,
    loading,
    refreshSubscription,
    upgradeToProTier,
    useCredits,
    getRemainingCredits,
    getCreditUsagePercentage,
    isProTier,
    isNearCreditLimit
  }

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}