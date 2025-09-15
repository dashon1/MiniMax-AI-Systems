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
        const { action, emailData, messageId, query, maxResults, labelIds } = await req.json();
        
        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Extract JWT from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header provided');
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            throw new Error('Invalid authorization format');
        }

        // Verify user token
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid or expired token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;
        const tenantId = userData.app_metadata?.tenant_id;

        if (!tenantId) {
            throw new Error('No tenant ID found for user');
        }

        console.log(`Gmail ${action} called by user: ${userId}`);

        // Get user's Google access token for Gmail
        const tokenResponse = await fetch(
            `${supabaseUrl}/rest/v1/google_auth_tokens?user_id=eq.${userId}&gmail_enabled=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!tokenResponse.ok) {
            throw new Error('Failed to get Google auth tokens');
        }

        const tokenData = await tokenResponse.json();
        if (!tokenData || tokenData.length === 0) {
            throw new Error('No Gmail access token found. Please connect your Google account first.');
        }

        const userToken = tokenData[0];
        
        // Check if token is expired
        let accessToken = userToken.access_token;
        if (new Date(userToken.token_expires_at) <= new Date()) {
            throw new Error('Gmail access token expired. Please re-authenticate.');
        }

        if (action === 'send_email') {
            // Send email via Gmail API
            if (!emailData || !emailData.to || !emailData.subject) {
                throw new Error('Email data with recipient and subject is required');
            }

            // Create email in RFC2822 format
            const emailLines = [];
            emailLines.push(`To: ${emailData.to}`);
            if (emailData.cc) emailLines.push(`Cc: ${emailData.cc}`);
            if (emailData.bcc) emailLines.push(`Bcc: ${emailData.bcc}`);
            emailLines.push(`Subject: ${emailData.subject}`);
            emailLines.push('Content-Type: text/html; charset=utf-8');
            emailLines.push('');
            emailLines.push(emailData.body || '');

            const email = emailLines.join('\r\n');
            
            // Encode email in base64url format
            const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    raw: encodedEmail
                })
            });

            if (!sendResponse.ok) {
                const errorData = await sendResponse.text();
                throw new Error(`Failed to send email: ${errorData}`);
            }

            const sentMessage = await sendResponse.json();

            // Save email to local database
            const emailRecord = {
                user_id: userId,
                tenant_id: tenantId,
                gmail_message_id: sentMessage.id,
                message_type: 'sent',
                subject: emailData.subject,
                sender: userToken.user_email,
                recipients: [emailData.to],
                cc_recipients: emailData.cc ? [emailData.cc] : [],
                bcc_recipients: emailData.bcc ? [emailData.bcc] : [],
                body_text: emailData.body || '',
                sent_at: new Date().toISOString(),
                sync_status: 'synced',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await fetch(
                `${supabaseUrl}/rest/v1/email_messages_sync`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(emailRecord)
                }
            );
            
            return new Response(JSON.stringify({
                data: {
                    message: sentMessage,
                    local_record_id: sentMessage.id,
                    sent_at: emailRecord.sent_at
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_messages') {
            // Get messages from Gmail
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (maxResults) params.append('maxResults', maxResults.toString());
            if (labelIds) params.append('labelIds', labelIds.join(','));

            const messagesResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!messagesResponse.ok) {
                const errorData = await messagesResponse.text();
                throw new Error(`Failed to get messages: ${errorData}`);
            }

            const messagesData = await messagesResponse.json();
            const messages = messagesData.messages || [];

            // Get detailed message data
            const detailedMessages = [];
            for (const message of messages.slice(0, Math.min(messages.length, maxResults || 50))) {
                const messageResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );

                if (messageResponse.ok) {
                    const messageDetail = await messageResponse.json();
                    detailedMessages.push(messageDetail);

                    // Sync message to local database
                    const headers = messageDetail.payload?.headers || [];
                    const subject = headers.find(h => h.name === 'Subject')?.value || '';
                    const from = headers.find(h => h.name === 'From')?.value || '';
                    const to = headers.find(h => h.name === 'To')?.value || '';
                    const date = headers.find(h => h.name === 'Date')?.value || '';

                    let bodyText = '';
                    if (messageDetail.payload?.body?.data) {
                        bodyText = atob(messageDetail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                    } else if (messageDetail.payload?.parts) {
                        const textPart = messageDetail.payload.parts.find(part => part.mimeType === 'text/plain');
                        if (textPart?.body?.data) {
                            bodyText = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                        }
                    }

                    const emailRecord = {
                        user_id: userId,
                        tenant_id: tenantId,
                        gmail_message_id: messageDetail.id,
                        message_type: 'received',
                        subject: subject,
                        sender: from,
                        recipients: [to],
                        cc_recipients: [],
                        bcc_recipients: [],
                        body_text: bodyText,
                        received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
                        sync_status: 'synced',
                        gmail_thread_id: messageDetail.threadId,
                        gmail_labels: messageDetail.labelIds || [],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    // Check if message exists locally
                    const existingMessageResponse = await fetch(
                        `${supabaseUrl}/rest/v1/email_messages_sync?user_id=eq.${userId}&gmail_message_id=eq.${messageDetail.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );

                    const existingMessages = await existingMessageResponse.json();
                    
                    if (!existingMessages || existingMessages.length === 0) {
                        // Create new message record
                        await fetch(
                            `${supabaseUrl}/rest/v1/email_messages_sync`,
                            {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(emailRecord)
                            }
                        );
                    }
                }
            }
            
            return new Response(JSON.stringify({
                data: {
                    messages: detailedMessages,
                    total: messagesData.resultSizeEstimate || detailedMessages.length,
                    synced_count: detailedMessages.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_message') {
            // Get specific message details
            if (!messageId) {
                throw new Error('Message ID is required');
            }

            const messageResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!messageResponse.ok) {
                const errorData = await messageResponse.text();
                throw new Error(`Failed to get message: ${errorData}`);
            }

            const messageDetail = await messageResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    message: messageDetail
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_labels') {
            // Get Gmail labels
            const labelsResponse = await fetch(
                'https://gmail.googleapis.com/gmail/v1/users/me/labels',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!labelsResponse.ok) {
                const errorData = await labelsResponse.text();
                throw new Error(`Failed to get labels: ${errorData}`);
            }

            const labelsData = await labelsResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    labels: labelsData.labels || [],
                    total: labelsData.labels?.length || 0
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'mark_as_read') {
            // Mark message as read
            if (!messageId) {
                throw new Error('Message ID is required');
            }

            const modifyResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        removeLabelIds: ['UNREAD']
                    })
                }
            );

            if (!modifyResponse.ok) {
                const errorData = await modifyResponse.text();
                throw new Error(`Failed to mark as read: ${errorData}`);
            }

            const result = await modifyResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message_id: messageId,
                    result: result
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'create_draft') {
            // Create email draft
            if (!emailData || !emailData.to || !emailData.subject) {
                throw new Error('Email data with recipient and subject is required');
            }

            // Create email in RFC2822 format
            const emailLines = [];
            emailLines.push(`To: ${emailData.to}`);
            if (emailData.cc) emailLines.push(`Cc: ${emailData.cc}`);
            if (emailData.bcc) emailLines.push(`Bcc: ${emailData.bcc}`);
            emailLines.push(`Subject: ${emailData.subject}`);
            emailLines.push('Content-Type: text/html; charset=utf-8');
            emailLines.push('');
            emailLines.push(emailData.body || '');

            const email = emailLines.join('\r\n');
            
            // Encode email in base64url format
            const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            const draftResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        raw: encodedEmail
                    }
                })
            });

            if (!draftResponse.ok) {
                const errorData = await draftResponse.text();
                throw new Error(`Failed to create draft: ${errorData}`);
            }

            const draft = await draftResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    draft: draft,
                    draft_id: draft.id
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action specified');

    } catch (error) {
        console.error('Gmail service error:', error);

        const errorResponse = {
            error: {
                code: 'GMAIL_SERVICE_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});