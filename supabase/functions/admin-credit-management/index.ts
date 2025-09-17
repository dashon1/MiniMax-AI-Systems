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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Missing Supabase configuration');
        }

        const { action, userId, credits, description, adminUserId } = await req.json();

        // Verify admin permissions
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${adminUserId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        const adminData = await adminCheckResponse.json();
        if (!adminData || adminData.length === 0) {
            throw new Error('Unauthorized: Admin access required');
        }

        let result;
        switch (action) {
            case 'allocate':
                // Get current balance
                const balanceResponse = await fetch(
                    `${supabaseUrl}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=1`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                const lastTransaction = await balanceResponse.json();
                const currentBalance = lastTransaction.length > 0 ? lastTransaction[0].balance_after : 0;
                const newBalance = currentBalance + credits;

                // Create credit transaction
                const transactionResponse = await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: crypto.randomUUID(),
                        user_id: userId,
                        transaction_type: 'credit',
                        credits_amount: credits,
                        description: description || 'Admin allocation',
                        balance_before: currentBalance,
                        balance_after: newBalance,
                        created_at: new Date().toISOString()
                    })
                });
                result = await transactionResponse.json();
                break;

            case 'deduct':
                // Get current balance
                const deductBalanceResponse = await fetch(
                    `${supabaseUrl}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=1`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                const lastDeductTransaction = await deductBalanceResponse.json();
                const currentDeductBalance = lastDeductTransaction.length > 0 ? lastDeductTransaction[0].balance_after : 0;
                
                if (currentDeductBalance < credits) {
                    throw new Error('Insufficient credits');
                }
                
                const newDeductBalance = currentDeductBalance - credits;

                // Create debit transaction
                const debitResponse = await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: crypto.randomUUID(),
                        user_id: userId,
                        transaction_type: 'debit',
                        credits_amount: -credits,
                        description: description || 'Admin deduction',
                        balance_before: currentDeductBalance,
                        balance_after: newDeductBalance,
                        created_at: new Date().toISOString()
                    })
                });
                result = await debitResponse.json();
                break;

            case 'history':
                // Get transaction history
                const historyResponse = await fetch(
                    `${supabaseUrl}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=50`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                result = await historyResponse.json();
                break;

            case 'balance':
                // Get current balance
                const currentBalanceResponse = await fetch(
                    `${supabaseUrl}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=1`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                const currentTransactions = await currentBalanceResponse.json();
                result = {
                    balance: currentTransactions.length > 0 ? currentTransactions[0].balance_after : 0
                };
                break;

            case 'analytics':
                // Get credit analytics
                const analyticsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/credit_transactions?order=created_at.desc&limit=1000`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                const allTransactions = await analyticsResponse.json();
                
                const analytics = {
                    totalCreditsAllocated: allTransactions
                        .filter(t => t.transaction_type === 'credit')
                        .reduce((sum, t) => sum + t.credits_amount, 0),
                    totalCreditsUsed: allTransactions
                        .filter(t => t.transaction_type === 'debit')
                        .reduce((sum, t) => sum + Math.abs(t.credits_amount), 0),
                    totalTransactions: allTransactions.length,
                    recentTransactions: allTransactions.slice(0, 10)
                };
                
                result = analytics;
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Credit management error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'CREDIT_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
