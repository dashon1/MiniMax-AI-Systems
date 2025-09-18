import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Create client with user token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error(`User authentication failed: ${userError?.message || 'No user found'}`);
    }

    console.log('Authenticated user:', user.id);

    // Check if the user has tasks in the database
    const { data: userTasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id, task_content, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tasksError) {
      console.error('Error querying tasks:', tasksError);
      throw new Error(`Database query error: ${tasksError.message}`);
    }

    // Check if the user can query their own tasks using RLS
    const { data: rlsTasks, error: rlsError } = await supabaseUser
      .from('tasks')
      .select('id, task_content, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const diagnostics = {
      user_authenticated: true,
      user_id: user.id,
      user_email: user.email,
      admin_query_results: {
        total_tasks: userTasks?.length || 0,
        tasks: userTasks?.slice(0, 3) || []
      },
      rls_query_results: {
        success: !rlsError,
        error: rlsError?.message || null,
        total_tasks: rlsTasks?.length || 0,
        tasks: rlsTasks?.slice(0, 3) || []
      },
      rls_working: !rlsError && (rlsTasks?.length || 0) === (userTasks?.length || 0)
    };

    // If RLS is not working properly, try to refresh the user session
    if (rlsError || (rlsTasks?.length || 0) !== (userTasks?.length || 0)) {
      console.log('RLS query failed or returned different results, attempting session refresh');
      
      // Force a token refresh
      const { data: refreshData, error: refreshError } = await supabaseUser.auth.refreshSession();
      
      if (refreshError) {
        diagnostics.session_refresh = {
          success: false,
          error: refreshError.message
        };
      } else {
        diagnostics.session_refresh = {
          success: true,
          new_access_token: refreshData.session?.access_token ? 'present' : 'missing'
        };
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: diagnostics 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fix task history error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: {
        code: 'DIAGNOSTIC_ERROR',
        message: error.message,
        details: 'Authentication or database query failed'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});