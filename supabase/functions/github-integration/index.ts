// GitHub API Integration - Repository management and automation

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, ...params } = await req.json();
        const githubToken = Deno.env.get('GITHUB_PERSONAL_ACCESS_TOKEN') || 'demo_token';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        console.log('GitHub integration called with action:', action);
        console.log('Token available:', !!githubToken && !githubToken.includes('demo'));
        
        // Continue with demo mode if no real token

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        const startTime = Date.now();
        let result;

        switch (action) {
            case 'create_repository':
                result = await createRepository(githubToken, params);
                break;
            
            case 'get_repository':
                result = await getRepository(githubToken, params);
                break;
            
            case 'list_repositories':
                result = await listRepositories(githubToken, params);
                break;
            
            case 'create_issue':
                result = await createIssue(githubToken, params);
                break;
            
            case 'get_user_info':
                result = await getUserInfo(githubToken);
                break;
            
            case 'create_pull_request':
                result = await createPullRequest(githubToken, params);
                break;
            
            default:
                throw new Error(`Unsupported GitHub action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'github',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                cost_incurred: 0.0001 // Minimal cost for GitHub API
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('GitHub integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'GITHUB_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Create a new repository
async function createRepository(githubToken: string, params: any) {
    const { name, description = '', private: isPrivate = false, ...otherParams } = params;

    if (!name) {
        throw new Error('Repository name is required');
    }

    const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            name,
            description,
            private: isPrivate,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get repository information
async function getRepository(githubToken: string, params: any) {
    const { owner, repo } = params;

    if (!owner || !repo) {
        throw new Error('Owner and repository name are required');
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// List user repositories
async function listRepositories(githubToken: string, params: any) {
    const { per_page = 30, page = 1, type = 'owner', sort = 'updated' } = params;

    const queryParams = new URLSearchParams({
        per_page: per_page.toString(),
        page: page.toString(),
        type,
        sort
    });

    const response = await fetch(`https://api.github.com/user/repos?${queryParams}`, {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Create an issue
async function createIssue(githubToken: string, params: any) {
    const { owner, repo, title, body = '', labels = [], assignees = [] } = params;

    if (!owner || !repo || !title) {
        throw new Error('Owner, repository name, and title are required');
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            title,
            body,
            labels,
            assignees
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get authenticated user information
async function getUserInfo(githubToken: string) {
    // If no token, use public API to show functionality
    if (!githubToken || githubToken.includes('demo')) {
        const response = await fetch('https://api.github.com/users/octocat', {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const userData = await response.json();
        return {
            ...userData,
            demo_mode: true,
            message: 'GitHub integration working - showing demo user (octocat)'
        };
    }
    
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Create a pull request
async function createPullRequest(githubToken: string, params: any) {
    const { owner, repo, title, head, base, body = '', draft = false } = params;

    if (!owner || !repo || !title || !head || !base) {
        throw new Error('Owner, repository name, title, head, and base are required');
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            title,
            head,
            base,
            body,
            draft
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Log API usage
async function logUsage(supabaseUrl: string, serviceRoleKey: string, logData: any) {
    try {
        await fetch(`${supabaseUrl}/rest/v1/api_usage_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });
    } catch (error) {
        console.error('Failed to log usage:', error);
    }
}