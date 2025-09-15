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
        const { action, eventData, calendarId, eventId, timeRange } = await req.json();
        
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
            throw new Error('No Google Calendar access token found');
        }

        const userToken = tokenData[0];
        
        // Check if token is expired and refresh if needed
        let accessToken = userToken.access_token;
        if (new Date(userToken.token_expires_at) <= new Date()) {
            // TODO: Implement token refresh logic here
            throw new Error('Google access token expired. Please re-authenticate.');
        }

        let result = {};

        if (action === 'sync_calendars') {
            // Sync user's calendars from Google
            const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!calendarsResponse.ok) {
                const errorData = await calendarsResponse.text();
                throw new Error(`Failed to fetch calendars: ${errorData}`);
            }

            const calendarsData = await calendarsResponse.json();
            const calendars = calendarsData.items || [];

            // Store calendars in database
            for (const calendar of calendars) {
                const calendarRecord = {
                    tenant_id: tenantId,
                    user_id: userId,
                    google_calendar_id: calendar.id,
                    calendar_name: calendar.summary,
                    calendar_description: calendar.description || '',
                    is_primary: calendar.primary || false,
                    calendar_timezone: calendar.timeZone,
                    color_id: calendar.colorId,
                    access_role: calendar.accessRole,
                    sync_status: 'active',
                    last_sync: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                await fetch(`${supabaseUrl}/rest/v1/calendar_integrations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify(calendarRecord)
                });
            }

            result = {
                type: 'calendars_synced',
                calendars_count: calendars.length,
                calendars: calendars.map(cal => ({
                    id: cal.id,
                    name: cal.summary,
                    primary: cal.primary,
                    timezone: cal.timeZone
                }))
            };

        } else if (action === 'sync_events') {
            // Sync events from specified calendar or all calendars
            const targetCalendarId = calendarId || 'primary';
            
            // Default to events from the last 30 days and next 90 days
            const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

            const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?` +
                `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;

            const eventsResponse = await fetch(eventsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!eventsResponse.ok) {
                const errorData = await eventsResponse.text();
                throw new Error(`Failed to fetch events: ${errorData}`);
            }

            const eventsData = await eventsResponse.json();
            const events = eventsData.items || [];

            // Store events in database
            let syncedCount = 0;
            for (const event of events) {
                if (!event.start || !event.end) continue; // Skip events without time

                const eventRecord = {
                    tenant_id: tenantId,
                    user_id: userId,
                    calendar_integration_id: null, // Will be set based on calendar lookup
                    google_event_id: event.id,
                    event_title: event.summary || 'Untitled Event',
                    event_description: event.description || '',
                    event_location: event.location || '',
                    start_datetime: event.start.dateTime || event.start.date,
                    end_datetime: event.end.dateTime || event.end.date,
                    is_all_day: !event.start.dateTime,
                    event_timezone: event.start.timeZone || 'UTC',
                    attendees: event.attendees || [],
                    meeting_link: event.hangoutLink || '',
                    event_status: event.status || 'confirmed',
                    recurrence_rule: event.recurrence ? event.recurrence.join(';') : null,
                    sync_status: 'synced',
                    last_modified: event.updated,
                    updated_at: new Date().toISOString()
                };

                await fetch(`${supabaseUrl}/rest/v1/calendar_events_sync`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify(eventRecord)
                });

                syncedCount++;
            }

            result = {
                type: 'events_synced',
                calendar_id: targetCalendarId,
                events_count: syncedCount,
                time_range: { timeMin, timeMax }
            };

        } else if (action === 'create_event') {
            // Create new event in Google Calendar
            const targetCalendarId = calendarId || 'primary';
            
            const createEventResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                }
            );

            if (!createEventResponse.ok) {
                const errorData = await createEventResponse.text();
                throw new Error(`Failed to create event: ${errorData}`);
            }

            const createdEvent = await createEventResponse.json();

            // Store in local database
            const eventRecord = {
                tenant_id: tenantId,
                user_id: userId,
                google_event_id: createdEvent.id,
                event_title: createdEvent.summary,
                event_description: createdEvent.description || '',
                event_location: createdEvent.location || '',
                start_datetime: createdEvent.start.dateTime || createdEvent.start.date,
                end_datetime: createdEvent.end.dateTime || createdEvent.end.date,
                is_all_day: !createdEvent.start.dateTime,
                event_timezone: createdEvent.start.timeZone || 'UTC',
                attendees: createdEvent.attendees || [],
                meeting_link: createdEvent.hangoutLink || '',
                created_by_ai: true,
                sync_status: 'synced',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/calendar_events_sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(eventRecord)
            });

            result = {
                type: 'event_created',
                google_event: createdEvent,
                local_event: insertResponse.ok ? await insertResponse.json() : null
            };

        } else if (action === 'update_event') {
            // Update existing event in Google Calendar
            const targetCalendarId = calendarId || 'primary';
            
            const updateEventResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                }
            );

            if (!updateEventResponse.ok) {
                const errorData = await updateEventResponse.text();
                throw new Error(`Failed to update event: ${errorData}`);
            }

            const updatedEvent = await updateEventResponse.json();

            // Update in local database
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/calendar_events_sync?google_event_id=eq.${eventId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_title: updatedEvent.summary,
                        event_description: updatedEvent.description || '',
                        event_location: updatedEvent.location || '',
                        start_datetime: updatedEvent.start.dateTime || updatedEvent.start.date,
                        end_datetime: updatedEvent.end.dateTime || updatedEvent.end.date,
                        last_modified: updatedEvent.updated,
                        updated_at: new Date().toISOString()
                    })
                }
            );

            result = {
                type: 'event_updated',
                google_event: updatedEvent
            };

        } else if (action === 'delete_event') {
            // Delete event from Google Calendar
            const targetCalendarId = calendarId || 'primary';
            
            const deleteEventResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!deleteEventResponse.ok && deleteEventResponse.status !== 404) {
                const errorData = await deleteEventResponse.text();
                throw new Error(`Failed to delete event: ${errorData}`);
            }

            // Update in local database (mark as deleted rather than actually deleting)
            await fetch(
                `${supabaseUrl}/rest/v1/calendar_events_sync?google_event_id=eq.${eventId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_status: 'cancelled',
                        sync_status: 'deleted',
                        updated_at: new Date().toISOString()
                    })
                }
            );

            result = {
                type: 'event_deleted',
                event_id: eventId
            };
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Calendar sync error:', error);

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