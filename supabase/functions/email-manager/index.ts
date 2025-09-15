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
        const { action, emailData, templateId, variables, messageId, query } = await req.json();
        
        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;
        const tenantId = userData.app_metadata?.tenant_id;

        if (!tenantId) {
            throw new Error('No tenant ID found for user');
        }

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
            throw new Error('No Gmail access token found');
        }

        const userToken = tokenData[0];
        
        // Check if token is expired and refresh if needed
        let accessToken = userToken.access_token;
        if (new Date(userToken.token_expires_at) <= new Date()) {
            throw new Error('Gmail access token expired. Please re-authenticate.');
        }

        let result = {};

        if (action === 'send_email') {
            // Send email via Gmail API
            const email = {
                to: emailData.to,
                cc: emailData.cc || [],
                bcc: emailData.bcc || [],
                subject: emailData.subject,
                body: emailData.body,
                html: emailData.html || false
            };

            // Create email message in RFC 2822 format
            let message = '';
            message += `To: ${email.to.join(', ')}\r\n`;
            if (email.cc.length > 0) message += `Cc: ${email.cc.join(', ')}\r\n`;
            if (email.bcc.length > 0) message += `Bcc: ${email.bcc.join(', ')}\r\n`;
            message += `Subject: ${email.subject}\r\n`;
            if (email.html) {
                message += `Content-Type: text/html; charset=utf-8\r\n`;
            } else {
                message += `Content-Type: text/plain; charset=utf-8\r\n`;
            }
            message += `\r\n${email.body}`;

            // Encode message in base64url
            const encodedMessage = btoa(message)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ raw: encodedMessage })
            });

            if (!sendResponse.ok) {
                const errorData = await sendResponse.text();
                throw new Error(`Failed to send email: ${errorData}`);
            }

            const sentMessage = await sendResponse.json();

            result = {
                type: 'email_sent',
                message_id: sentMessage.id,
                thread_id: sentMessage.threadId,
                recipients: {
                    to: email.to,
                    cc: email.cc,
                    bcc: email.bcc
                }
            };

        } else if (action === 'send_template_email') {
            // Send email using template with variable substitution
            const templateResponse = await fetch(
                `${supabaseUrl}/rest/v1/email_templates_enhanced?id=eq.${templateId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!templateResponse.ok) {
                throw new Error('Failed to fetch email template');
            }

            const templates = await templateResponse.json();
            if (!templates || templates.length === 0) {
                throw new Error('Email template not found');
            }

            const template = templates[0];

            // Substitute variables in subject and body
            let subject = template.subject_template;
            let body = template.body_template;

            if (variables) {
                for (const [key, value] of Object.entries(variables)) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    subject = subject.replace(regex, value as string);
                    body = body.replace(regex, value as string);
                }
            }

            // Create and send email
            const processedEmailData = {
                ...emailData,
                subject: subject,
                body: body
            };

            // Use the send_email logic
            const email = {
                to: processedEmailData.to,
                cc: processedEmailData.cc || [],
                bcc: processedEmailData.bcc || [],
                subject: subject,
                body: body
            };

            let message = '';
            message += `To: ${email.to.join(', ')}\r\n`;
            if (email.cc.length > 0) message += `Cc: ${email.cc.join(', ')}\r\n`;
            if (email.bcc.length > 0) message += `Bcc: ${email.bcc.join(', ')}\r\n`;
            message += `Subject: ${email.subject}\r\n`;
            message += `Content-Type: text/plain; charset=utf-8\r\n`;
            message += `\r\n${email.body}`;

            const encodedMessage = btoa(message)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ raw: encodedMessage })
            });

            if (!sendResponse.ok) {
                const errorData = await sendResponse.text();
                throw new Error(`Failed to send template email: ${errorData}`);
            }

            const sentMessage = await sendResponse.json();

            // Update template usage count
            await fetch(
                `${supabaseUrl}/rest/v1/email_templates_enhanced?id=eq.${templateId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        usage_count: template.usage_count + 1,
                        last_used: new Date().toISOString()
                    })
                }
            );

            result = {
                type: 'template_email_sent',
                template_id: templateId,
                message_id: sentMessage.id,
                thread_id: sentMessage.threadId,
                processed_subject: subject,
                recipients: {
                    to: email.to,
                    cc: email.cc,
                    bcc: email.bcc
                }
            };

        } else if (action === 'get_messages') {
            // Fetch messages from Gmail
            const maxResults = query?.maxResults || 50;
            const labelIds = query?.labelIds || ['INBOX'];
            const q = query?.q || '';

            let messagesUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
            if (labelIds.length > 0) {
                messagesUrl += `&labelIds=${labelIds.join('&labelIds=')}`;
            }
            if (q) {
                messagesUrl += `&q=${encodeURIComponent(q)}`;
            }

            const messagesResponse = await fetch(messagesUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!messagesResponse.ok) {
                const errorData = await messagesResponse.text();
                throw new Error(`Failed to fetch messages: ${errorData}`);
            }

            const messagesData = await messagesResponse.json();
            const messages = messagesData.messages || [];

            // Fetch details for each message
            const detailedMessages = [];
            for (const message of messages.slice(0, 10)) { // Limit to 10 for performance
                const messageDetailResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );

                if (messageDetailResponse.ok) {
                    const messageDetail = await messageDetailResponse.json();
                    
                    // Extract key information
                    const headers = messageDetail.payload?.headers || [];
                    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
                    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
                    const date = headers.find(h => h.name === 'Date')?.value || '';
                    
                    detailedMessages.push({
                        id: message.id,
                        threadId: message.threadId,
                        subject: subject,
                        from: from,
                        date: date,
                        snippet: messageDetail.snippet,
                        labelIds: messageDetail.labelIds,
                        unread: messageDetail.labelIds?.includes('UNREAD') || false
                    });
                }
            }

            result = {
                type: 'messages_fetched',
                messages: detailedMessages,
                total_count: messagesData.resultSizeEstimate || 0
            };

        } else if (action === 'get_message_detail') {
            // Get full details of a specific message
            const messageDetailResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!messageDetailResponse.ok) {
                const errorData = await messageDetailResponse.text();
                throw new Error(`Failed to fetch message detail: ${errorData}`);
            }

            const messageDetail = await messageDetailResponse.json();
            
            // Extract and format message content
            const headers = messageDetail.payload?.headers || [];
            let body = '';
            
            if (messageDetail.payload?.body?.data) {
                body = atob(messageDetail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } else if (messageDetail.payload?.parts) {
                // Handle multipart messages
                for (const part of messageDetail.payload.parts) {
                    if (part.mimeType === 'text/plain' && part.body?.data) {
                        body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                        break;
                    }
                }
            }

            result = {
                type: 'message_detail',
                message: {
                    id: messageDetail.id,
                    threadId: messageDetail.threadId,
                    headers: headers,
                    body: body,
                    snippet: messageDetail.snippet,
                    labelIds: messageDetail.labelIds,
                    payload: messageDetail.payload
                }
            };

        } else if (action === 'mark_as_read') {
            // Mark message as read
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
                throw new Error(`Failed to mark message as read: ${errorData}`);
            }

            result = {
                type: 'message_marked_read',
                message_id: messageId
            };

        } else if (action === 'get_templates') {
            // Get email templates for the user
            const templatesResponse = await fetch(
                `${supabaseUrl}/rest/v1/email_templates_enhanced?or=(tenant_id.eq.${tenantId},is_shared.eq.true)&is_active=eq.true&order=template_category,template_name`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!templatesResponse.ok) {
                throw new Error('Failed to fetch email templates');
            }

            const templates = await templatesResponse.json();

            result = {
                type: 'templates_fetched',
                templates: templates
            };
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Email manager error:', error);

        const errorResponse = {
            error: {
                code: 'EMAIL_MANAGER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});