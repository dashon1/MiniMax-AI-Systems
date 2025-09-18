import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'No authorization header found',
        debug: {
          headers: Object.fromEntries(req.headers.entries())
        }
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Authentication failed',
        authError: authError?.message,
        debug: {
          token: token ? 'Present' : 'Missing',
          tokenLength: token?.length || 0
        }
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get all tasks for debugging
    const { data: allTasks, error: allTasksError } = await supabase
      .from('tasks')
      .select('id, user_id, task_content, status, created_at')
      .order('created_at', { ascending: false })

    // Get tasks for this specific user
    const { data: userTasks, error: userTasksError } = await supabase
      .from('tasks')
      .select('id, user_id, task_content, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get all unique user IDs from tasks
    const { data: uniqueUsers, error: uniqueUsersError } = await supabase
      .from('tasks')
      .select('user_id')

    const uniqueUserIds = [...new Set(uniqueUsers?.map(t => t.user_id) || [])]

    return new Response(JSON.stringify({
      success: true,
      debug: {
        currentUser: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        taskCounts: {
          allTasks: allTasks?.length || 0,
          userTasks: userTasks?.length || 0
        },
        uniqueUserIds,
        recentTasks: allTasks?.slice(0, 3),
        userTasksPreview: userTasks?.slice(0, 3),
        errors: {
          allTasksError: allTasksError?.message,
          userTasksError: userTasksError?.message,
          uniqueUsersError: uniqueUsersError?.message
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Task history debug error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
