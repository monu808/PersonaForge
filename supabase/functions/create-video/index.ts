import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
const TAVUS_API_URL = "https://api.tavus.io/v2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Validate environment variables
    if (!TAVUS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Parse request body
    const { personaId, script } = await req.json();
    if (!personaId || !script) {
      throw new Error('Missing required parameters: personaId and script');
    }

    // Get user's Tavus replica ID
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('tavus_replica_id')
      .single();

    if (settingsError || !userSettings?.tavus_replica_id) {
      throw new Error('Tavus replica ID not found. Please set up your Tavus integration first.');
    }

    // Call Tavus API with retry logic
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${TAVUS_API_URL}/videos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TAVUS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script,
            replica_id: userSettings.tavus_replica_id,
            callback_url: `${SUPABASE_URL}/functions/v1/tavus-webhook`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Tavus API error: ${response.status}`);
        }

        const data = await response.json();

        // Create persona_content record
        const { error: insertError } = await supabase
          .from('persona_content')
          .insert({
            persona_id: personaId,
            content_type: 'video',
            content: script,
            metadata: {
              tavus_video_id: data.id,
              status: data.status,
              script,
            },
          });

        if (insertError) {
          console.error('Failed to create persona_content record:', insertError);
        }

        return new Response(JSON.stringify({
          id: data.id,
          status: data.status,
        }), {
          headers: corsHeaders,
        });
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
    }

    throw lastError || new Error('Failed to generate video after multiple attempts');
  } catch (error) {
    console.error('Error in create-video function:', error);
    
    return new Response(JSON.stringify({
      id: null,
      status: 'failed',
      error: error.message || 'An unexpected error occurred',
    }), {
      status: error.message.includes('authorization') ? 401 : 500,
      headers: corsHeaders,
    });
  }
});