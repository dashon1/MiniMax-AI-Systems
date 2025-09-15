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
        const { action, meetingData, schedulingId, timeSlots } = await req.json();
        
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

        let result = {};

        if (action === 'suggest_meeting_times') {
            // AI-powered meeting time suggestions
            const {
                title,
                description,
                attendees,
                duration = 60,
                preferredTimes = {},
                excludedTimes = {},
                timezone = 'UTC',
                bufferTime = 15
            } = meetingData;

            // Get user's calendar events for the next 30 days
            const startDate = new Date();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const eventsResponse = await fetch(
                `${supabaseUrl}/rest/v1/calendar_events_sync?user_id=eq.${userId}&start_datetime=gte.${startDate.toISOString()}&end_datetime=lte.${endDate.toISOString()}&event_status=neq.cancelled`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const existingEvents = eventsResponse.ok ? await eventsResponse.json() : [];

            // Generate time suggestions based on availability
            const suggestions = [];
            const workingHours = {
                start: preferredTimes.workingHoursStart || 9,
                end: preferredTimes.workingHoursEnd || 17
            };

            for (let day = 0; day < 14; day++) { // Check next 14 days
                const currentDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
                
                // Skip weekends if not preferred
                if (!preferredTimes.includeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
                    continue;
                }

                // Check each hour during working hours
                for (let hour = workingHours.start; hour <= workingHours.end - (duration / 60); hour++) {
                    const proposedStart = new Date(currentDate);
                    proposedStart.setHours(hour, 0, 0, 0);
                    
                    const proposedEnd = new Date(proposedStart.getTime() + duration * 60 * 1000);

                    // Check if this time conflicts with existing events
                    const hasConflict = existingEvents.some(event => {
                        const eventStart = new Date(event.start_datetime);
                        const eventEnd = new Date(event.end_datetime);
                        
                        // Add buffer time
                        const bufferedStart = new Date(proposedStart.getTime() - bufferTime * 60 * 1000);
                        const bufferedEnd = new Date(proposedEnd.getTime() + bufferTime * 60 * 1000);
                        
                        return (bufferedStart < eventEnd && bufferedEnd > eventStart);
                    });

                    if (!hasConflict) {
                        // Calculate a score based on preferences
                        let score = 100;
                        
                        // Prefer mid-morning and early afternoon
                        if (hour >= 10 && hour <= 11) score += 20;
                        if (hour >= 14 && hour <= 15) score += 15;
                        
                        // Penalize very early or late times
                        if (hour < 9 || hour > 16) score -= 10;
                        
                        // Prefer Tuesday to Thursday
                        if (currentDate.getDay() >= 2 && currentDate.getDay() <= 4) score += 10;
                        
                        suggestions.push({
                            start_time: proposedStart.toISOString(),
                            end_time: proposedEnd.toISOString(),
                            score: score,
                            day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                            date: currentDate.toLocaleDateString(),
                            time: proposedStart.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                            })
                        });
                    }
                }
            }

            // Sort by score and return top suggestions
            suggestions.sort((a, b) => b.score - a.score);
            const topSuggestions = suggestions.slice(0, 10);

            result = {
                type: 'meeting_times_suggested',
                suggestions: topSuggestions,
                meeting_details: {
                    title,
                    duration,
                    attendees,
                    timezone
                },
                analysis: {
                    total_slots_checked: suggestions.length,
                    conflicts_found: existingEvents.length,
                    best_score: topSuggestions[0]?.score || 0
                }
            };

        } else if (action === 'create_meeting_proposal') {
            // Create a meeting scheduling proposal
            const proposalRecord = {
                tenant_id: tenantId,
                user_id: userId,
                meeting_title: meetingData.title,
                meeting_description: meetingData.description || '',
                proposed_durations: meetingData.durations || [30, 60, 90],
                attendee_emails: meetingData.attendees || [],
                required_attendees: meetingData.requiredAttendees || [],
                optional_attendees: meetingData.optionalAttendees || [],
                preferred_times: meetingData.preferredTimes || {},
                excluded_times: meetingData.excludedTimes || {},
                meeting_timezone: meetingData.timezone || 'UTC',
                location_preference: meetingData.location || '',
                virtual_meeting_required: meetingData.virtualMeeting || false,
                buffer_time_minutes: meetingData.bufferTime || 15,
                scheduling_status: 'pending',
                created_by_ai: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/meeting_scheduling`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(proposalRecord)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Failed to create meeting proposal: ${errorText}`);
            }

            const savedProposal = await insertResponse.json();

            result = {
                type: 'meeting_proposal_created',
                proposal_id: savedProposal[0].id,
                proposal: savedProposal[0]
            };

        } else if (action === 'schedule_meeting') {
            // Schedule the meeting with selected time
            const { selectedTime, calendarId = 'primary' } = meetingData;

            // Get the meeting proposal
            const proposalResponse = await fetch(
                `${supabaseUrl}/rest/v1/meeting_scheduling?id=eq.${schedulingId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!proposalResponse.ok) {
                throw new Error('Meeting proposal not found');
            }

            const proposals = await proposalResponse.json();
            if (!proposals || proposals.length === 0) {
                throw new Error('Meeting proposal not found');
            }

            const proposal = proposals[0];

            // Create calendar event via calendar-sync-processor
            const eventData = {
                summary: proposal.meeting_title,
                description: proposal.meeting_description,
                location: proposal.location_preference,
                start: {
                    dateTime: selectedTime.start,
                    timeZone: proposal.meeting_timezone
                },
                end: {
                    dateTime: selectedTime.end,
                    timeZone: proposal.meeting_timezone
                },
                attendees: proposal.attendee_emails.map(email => ({ email })),
                conferenceData: proposal.virtual_meeting_required ? {
                    createRequest: {
                        requestId: `meeting-${proposal.id}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                } : undefined
            };

            // Call calendar sync processor to create the event
            const createEventResponse = await fetch(`${supabaseUrl}/functions/v1/calendar-sync-processor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create_event',
                    calendarId: calendarId,
                    eventData: eventData
                })
            });

            let calendarEvent = null;
            if (createEventResponse.ok) {
                const eventResult = await createEventResponse.json();
                calendarEvent = eventResult.data?.google_event;
            }

            // Update meeting proposal with scheduled time
            await fetch(
                `${supabaseUrl}/rest/v1/meeting_scheduling?id=eq.${schedulingId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        selected_time: selectedTime.start,
                        scheduling_status: 'scheduled',
                        calendar_event_id: calendarEvent?.id,
                        updated_at: new Date().toISOString()
                    })
                }
            );

            result = {
                type: 'meeting_scheduled',
                proposal_id: schedulingId,
                selected_time: selectedTime,
                calendar_event: calendarEvent,
                meeting_link: calendarEvent?.hangoutLink
            };

        } else if (action === 'get_scheduling_proposals') {
            // Get user's meeting scheduling proposals
            const proposalsResponse = await fetch(
                `${supabaseUrl}/rest/v1/meeting_scheduling?user_id=eq.${userId}&order=created_at.desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!proposalsResponse.ok) {
                throw new Error('Failed to fetch scheduling proposals');
            }

            const proposals = await proposalsResponse.json();

            result = {
                type: 'scheduling_proposals_fetched',
                proposals: proposals
            };

        } else if (action === 'check_availability') {
            // Check availability for multiple attendees
            const { attendeeEmails, timeRange, duration = 60 } = meetingData;
            
            // This is a simplified availability check
            // In a real implementation, you'd need to access other attendees' calendars
            // or integrate with scheduling services like Calendly
            
            const availability = {
                organizer_available: true, // Check organizer's calendar
                attendee_responses: attendeeEmails.map(email => ({
                    email: email,
                    available: 'unknown', // Would need external calendar access
                    conflicts: []
                })),
                suggested_alternatives: [
                    // Would generate based on known conflicts
                ]
            };

            result = {
                type: 'availability_checked',
                time_range: timeRange,
                duration: duration,
                availability: availability
            };
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Meeting scheduler error:', error);

        const errorResponse = {
            error: {
                code: 'MEETING_SCHEDULER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});