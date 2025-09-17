import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useAdminAuth(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminLevel, setAdminLevel] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!userId) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('admin_level, permissions')
          .eq('user_id', userId)
          .single()

        if (error) {
          console.error('Admin check error:', error)
          setIsAdmin(false)
        } else if (data) {
          setIsAdmin(true)
          setAdminLevel(data.admin_level)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Admin auth error:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [userId])

  return { isAdmin, loading, adminLevel }
}
