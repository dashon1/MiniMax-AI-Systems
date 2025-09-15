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
        const { action, audioData, fileName, conversationId, tenantId } = await req.json();

        if (!action) {
            throw new Error('Action parameter is required');
        }

        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization header missing');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid authentication token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        switch (action) {
            case 'upload_and_transcribe':
                return await uploadAndTranscribe(audioData, fileName, conversationId, tenantId, userId, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'get_recordings':
                return await getRecordings(conversationId, tenantId, userId, supabaseUrl, serviceRoleKey, corsHeaders);
            default:
                throw new Error(`Unsupported action: ${action}`);
        }

    } catch (error) {
        console.error('Voice processing error:', error);

        const errorResponse = {
            error: {
                code: 'VOICE_PROCESSING_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function uploadAndTranscribe(audioData: string, fileName: string, conversationId: string, tenantId: string, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    if (!audioData || !fileName || !conversationId || !tenantId) {
        throw new Error('Missing required parameters: audioData, fileName, conversationId, tenantId');
    }

    // Extract base64 data from data URL
    const base64Data = audioData.split(',')[1];
    if (!base64Data) {
        throw new Error('Invalid audio data format');
    }

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `voice-recordings/${tenantId}/${userId}/${timestamp}-${fileName}`;

    console.log(`Uploading voice recording: ${filePath}`);

    // Upload to Supabase Storage
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/voice-recordings/${filePath}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'audio/webm',
            'x-upsert': 'true'
        },
        body: binaryData
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${errorText}`);
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/voice-recordings/${filePath}`;

    // Simulate transcription (in production, you would use a real speech-to-text service)
    const transcriptionResult = await simulateTranscription(binaryData.length);

    // Save recording metadata to database
    const recordingData = {
        conversation_id: conversationId,
        tenant_id: tenantId,
        user_id: userId,
        file_path: publicUrl,
        file_size: binaryData.length,
        duration_seconds: transcriptionResult.duration,
        transcription: transcriptionResult.text,
        transcription_confidence: transcriptionResult.confidence,
        created_at: new Date().toISOString()
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/voice_recordings`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(recordingData)
    });

    if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('Database insert failed:', errorText);
        throw new Error(`Database insert failed: ${errorText}`);
    }

    const recording = await insertResponse.json();

    console.log('Voice recording processed successfully');

    return new Response(JSON.stringify({
        data: {
            recording: recording[0],
            transcription: transcriptionResult.text,
            confidence: transcriptionResult.confidence,
            duration: transcriptionResult.duration,
            fileUrl: publicUrl
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getRecordings(conversationId: string, tenantId: string, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    let query = `${supabaseUrl}/rest/v1/voice_recordings?tenant_id=eq.${tenantId}&user_id=eq.${userId}&order=created_at.desc`;
    
    if (conversationId) {
        query += `&conversation_id=eq.${conversationId}`;
    }

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch recordings: ${errorText}`);
    }

    const recordings = await response.json();

    return new Response(JSON.stringify({
        data: {
            recordings
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function simulateTranscription(fileSize: number) {
    // Simulate processing time based on file size
    const processingTime = Math.min(3000, fileSize / 1000);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate a simulated transcription based on common voice commands
    const sampleTranscriptions = [
        "Create a market research report for the AI automation industry focusing on competitive analysis and growth opportunities.",
        "Generate a content calendar for our social media channels with topics related to productivity and AI innovation.",
        "Analyze our current customer feedback and provide insights on feature requests and pain points.",
        "Research the latest trends in voice interface technology and prepare a summary for our product team.",
        "Create a business proposal for implementing multi-agent AI systems in enterprise workflows.",
        "Draft an email campaign for our upcoming product launch targeting small business owners.",
        "Analyze competitor pricing strategies and recommend adjustments to our subscription tiers.",
        "Research integration opportunities with popular productivity tools and CRM systems."
    ];

    const randomTranscription = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
    const duration = Math.max(5, fileSize / 8000); // Estimate duration based on file size
    const confidence = 0.85 + Math.random() * 0.1; // Random confidence between 0.85-0.95

    return {
        text: randomTranscription,
        duration: parseFloat(duration.toFixed(2)),
        confidence: parseFloat(confidence.toFixed(2))
    };
}