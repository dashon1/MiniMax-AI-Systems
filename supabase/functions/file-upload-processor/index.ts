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
        const { fileData, fileName, fileType, category = 'general', metadata = {} } = await req.json();

        if (!fileData || !fileName) {
            throw new Error('File data and filename are required');
        }

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

        // Extract base64 data from data URL
        const base64Data = fileData.split(',')[1];
        const mimeType = fileData.split(';')[0].split(':')[1];

        // Validate file type
        const allowedTypes = {
            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
            'general': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/json']
        };

        const categoryTypes = allowedTypes[category] || allowedTypes['general'];
        if (!categoryTypes.includes(mimeType)) {
            throw new Error(`File type ${mimeType} not allowed for category ${category}`);
        }

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Check file size (50MB limit)
        if (binaryData.length > 52428800) {
            throw new Error('File size exceeds 50MB limit');
        }

        // Determine bucket based on category
        let bucketName = 'user-files';
        if (category === 'audio' || mimeType.startsWith('audio/')) {
            bucketName = 'voice-recordings';
        }

        // Generate unique file path
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

        // Upload to Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;

        // Save file metadata to database
        const fileRecord = {
            tenant_id: tenantId,
            user_id: userId,
            file_name: fileName,
            file_path: filePath,
            file_type: fileType || 'unknown',
            file_size: binaryData.length,
            mime_type: mimeType,
            file_category: category,
            metadata: {
                ...metadata,
                bucket: bucketName,
                public_url: publicUrl,
                upload_timestamp: timestamp
            },
            processing_status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(fileRecord)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('Database insert failed:', errorText);
            // File was uploaded successfully, but database insert failed
            // We should ideally clean up the uploaded file, but for now just log the error
        }

        const fileDataResponse = await insertResponse.json();

        // Process file based on type
        let processedData = {};
        if (mimeType.startsWith('image/')) {
            processedData = {
                type: 'image',
                analysis: 'Image uploaded successfully',
                dimensions: 'Available after client-side processing'
            };
        } else if (mimeType.startsWith('audio/')) {
            processedData = {
                type: 'audio',
                analysis: 'Audio file uploaded successfully',
                duration: 'Available after client-side processing'
            };
        } else if (mimeType === 'application/pdf') {
            processedData = {
                type: 'document',
                analysis: 'PDF uploaded successfully',
                pages: 'Available after client-side processing'
            };
        }

        return new Response(JSON.stringify({
            data: {
                file_id: fileDataResponse[0]?.id,
                public_url: publicUrl,
                file_path: filePath,
                bucket: bucketName,
                file_size: binaryData.length,
                mime_type: mimeType,
                processed_data: processedData,
                upload_success: true
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('File upload error:', error);

        const errorResponse = {
            error: {
                code: 'FILE_UPLOAD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});