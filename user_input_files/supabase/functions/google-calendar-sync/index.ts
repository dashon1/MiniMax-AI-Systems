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
        const { action, eventData, calendarId, eventId, timeMin, timeMax, maxResults } = await req.json();
        
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

        console.log(`Google Calendar ${action} called by user: ${userId}`);

        // Get user's Google access token
        const tokenResponse = await fetch(
            `${supabaseUrl}/rest/v1/google_auth_tokens?user_id=eq.${userId}&calendar_enabled=eq.true`,
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
            throw new Error('No Google Calendar access token found. Please connect your Google account first.');
        }

        const userToken = tokenData[0];
        
        // Check if token is expired
        let accessToken = userToken.access_token;
        if (new Date(userToken.token_expires_at) <= new Date()) {
            throw new Error('Google Calendar access token expired. Please re-authenticate.');
        }

        if (action === 'get_calendars') {
            // Get list of user's calendars
            const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!calendarsResponse.ok) {
                const errorData = await calendarsResponse.text();
                throw new Error(`Failed to get calendars: ${errorData}`);
            }

            const calendarsData = await calendarsResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    calendars: calendarsData.items || [],
                    total: calendarsData.items?.length || 0
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_events') {
            // Get events from specified calendar
            const targetCalendarId = calendarId || 'primary';
            const params = new URLSearchParams();
            
            if (timeMin) params.append('timeMin', timeMin);
            if (timeMax) params.append('timeMax', timeMax);
            if (maxResults) params.append('maxResults', maxResults.toString());
            params.append('singleEvents', 'true');
            params.append('orderBy', 'startTime');

            const eventsResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!eventsResponse.ok) {
                const errorData = await eventsResponse.text();
                throw new Error(`Failed to get events: ${errorData}`);
            }

            const eventsData = await eventsResponse.json();

            // Sync events to local database
            const events = eventsData.items || [];
            for (const event of events) {
                const eventRecord = {
                    user_id: userId,
                    tenant_id: tenantId,
                    google_event_id: event.id,
                    title: event.summary || 'Untitled Event',
                    description: event.description || '',
                    start_time: event.start?.dateTime || event.start?.date,
                    end_time: event.end?.dateTime || event.end?.date,
                    location: event.location || '',
                    meeting_link: event.hangoutLink || '',
                    event_timezone: event.start?.timeZone || 'UTC',
                    recurrence_rule: event.recurrence ? JSON.stringify(event.recurrence) : null,
                    sync_status: 'synced',
                    google_calendar_id: targetCalendarId,
                    updated_at: new Date().toISOString()
                };

                // Check if event exists locally
                const existingEventResponse = await fetch(
                    `${supabaseUrl}/rest/v1/calendar_events?user_id=eq.${userId}&google_event_id=eq.${event.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const existingEvents = await existingEventResponse.json();
                
                if (existingEvents && existingEvents.length > 0) {
                    // Update existing event
                    await fetch(
                        `${supabaseUrl}/rest/v1/calendar_events?user_id=eq.${userId}&google_event_id=eq.${event.id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(eventRecord)
                        }
                    );
                } else {
                    // Create new event
                    await fetch(
                        `${supabaseUrl}/rest/v1/calendar_events`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(eventRecord)
                        }
                    );
                }
            }
            
            return new Response(JSON.stringify({
                data: {
                    events: events,
                    total: events.length,
                    synced_count: events.length,
                    calendar_id: targetCalendarId
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'create_event') {
            // Create new event in Google Calendar
            if (!eventData) {
                throw new Error('Event data is required');
            }

            const targetCalendarId = calendarId || 'primary';
            const googleEvent = {
                summary: eventData.title,
                description: eventData.description || '',
                location: eventData.location || '',
                start: {
                    dateTime: eventData.startTime,
                    timeZone: eventData.timezone || 'UTC'
                },
                end: {
                    dateTime: eventData.endTime,
                    timeZone: eventData.timezone || 'UTC'
                },
                attendees: eventData.attendees ? eventData.attendees.map(email => ({ email })) : [],
                reminders: {
                    useDefault: false,
                    overrides: eventData.reminders || [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 10 }
                    ]
                }
            };

            if (eventData.conferenceData) {
                googleEvent.conferenceData = {
                    createRequest: {
                        requestId: `meet-${Date.now()}`,
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet'
                        }
                    }
                };
            }

            const createResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(googleEvent)
                }
            );

            if (!createResponse.ok) {
                const errorData = await createResponse.text();
                throw new Error(`Failed to create event: ${errorData}`);
            }

            const createdEvent = await createResponse.json();

            // Save to local database
            const localEventRecord = {
                user_id: userId,
                tenant_id: tenantId,
                google_event_id: createdEvent.id,
                title: createdEvent.summary,
                description: createdEvent.description || '',
                start_time: createdEvent.start?.dateTime || createdEvent.start?.date,
                end_time: createdEvent.end?.dateTime || createdEvent.end?.date,
                location: createdEvent.location || '',
                meeting_link: createdEvent.hangoutLink || '',
                event_timezone: createdEvent.start?.timeZone || 'UTC',
                created_by_ai: eventData.createdByAi || false,
                linked_task_ids: eventData.linkedTaskIds || [],
                sync_status: 'synced',
                google_calendar_id: targetCalendarId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await fetch(
                `${supabaseUrl}/rest/v1/calendar_events`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(localEventRecord)
                }
            );
            
            return new Response(JSON.stringify({
                data: {
                    event: createdEvent,
                    local_event_id: localEventRecord.google_event_id,
                    calendar_id: targetCalendarId
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'update_event') {
            // Update existing event in Google Calendar
            if (!eventId || !eventData) {
                throw new Error('Event ID and event data are required');
            }

            const targetCalendarId = calendarId || 'primary';
            const googleEvent = {
                summary: eventData.title,
                description: eventData.description || '',
                location: eventData.location || '',
                start: {
                    dateTime: eventData.startTime,
                    timeZone: eventData.timezone || 'UTC'
                },
                end: {
                    dateTime: eventData.endTime,
                    timeZone: eventData.timezone || 'UTC'
                },
                attendees: eventData.attendees ? eventData.attendees.map(email => ({ email })) : []
            };

            const updateResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(googleEvent)
                }
            );

            if (!updateResponse.ok) {
                const errorData = await updateResponse.text();
                throw new Error(`Failed to update event: ${errorData}`);
            }

            const updatedEvent = await updateResponse.json();

            // Update local database
            const updateData = {
                title: updatedEvent.summary,
                description: updatedEvent.description || '',
                start_time: updatedEvent.start?.dateTime || updatedEvent.start?.date,
                end_time: updatedEvent.end?.dateTime || updatedEvent.end?.date,
                location: updatedEvent.location || '',
                meeting_link: updatedEvent.hangoutLink || '',
                event_timezone: updatedEvent.start?.timeZone || 'UTC',
                sync_status: 'synced',
                updated_at: new Date().toISOString()
            };

            await fetch(
                `${supabaseUrl}/rest/v1/calendar_events?user_id=eq.${userId}&google_event_id=eq.${eventId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                }
            );
            
            return new Response(JSON.stringify({
                data: {
                    event: updatedEvent,
                    calendar_id: targetCalendarId
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'delete_event') {
            // Delete event from Google Calendar
            if (!eventId) {
                throw new Error('Event ID is required');
            }

            const targetCalendarId = calendarId || 'primary';

            const deleteResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!deleteResponse.ok && deleteResponse.status !== 410) { // 410 = Gone (already deleted)
                const errorData = await deleteResponse.text();
                throw new Error(`Failed to delete event: ${errorData}`);
            }

            // Remove from local database
            await fetch(
                `${supabaseUrl}/rest/v1/calendar_events?user_id=eq.${userId}&google_event_id=eq.${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            return new Response(JSON.stringify({
                data: {
                    success: true,
                    event_id: eventId,
                    calendar_id: targetCalendarId
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'check_conflicts') {
            // Check for calendar conflicts for a given time range
            if (!eventData?.startTime || !eventData?.endTime) {
                throw new Error('Start time and end time are required');
            }

            const params = new URLSearchParams({
                timeMin: eventData.startTime,
                timeMax: eventData.endTime,
                singleEvents: 'true',
                orderBy: 'startTime'
            });

            const targetCalendarId = calendarId || 'primary';
            const conflictsResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!conflictsResponse.ok) {
                const errorData = await conflictsResponse.text();
                throw new Error(`Failed to check conflicts: ${errorData}`);
            }

            const conflictsData = await conflictsResponse.json();
            const conflicts = conflictsData.items || [];

            // Filter out the current event if updating
            const filteredConflicts = conflicts.filter(event => event.id !== eventId);
            
            return new Response(JSON.stringify({
                data: {
                    has_conflicts: filteredConflicts.length > 0,
                    conflicts: filteredConflicts,
                    total_conflicts: filteredConflicts.length,
                    calendar_id: targetCalendarId
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action specified');

    } catch (error) {
        console.error('Google Calendar sync error:', error);

        const errorResponse = {
            error: {
                code: 'CALENDAR_SYNC_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});