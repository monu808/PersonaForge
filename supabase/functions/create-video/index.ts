import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
const TAVUS_API_URL = "https://api.tavus.io/v2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Handle preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Check required environment variables
    if (!TAVUS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("⛔️ Missing required environment variables!");
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: "Server configuration error. Please contact support.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { personaId, script } = await req.json();

    if (!personaId || !script) {
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: "Missing required parameters: personaId and script are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's Tavus replica ID from user_settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('tavus_replica_id')
      .single();

    if (settingsError || !userSettings?.tavus_replica_id) {
      console.error("❌ Failed to get Tavus replica ID:", settingsError);
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: "Tavus replica ID not found. Please set up your Tavus integration first.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🎥 Creating Tavus video with replica ID:", userSettings.tavus_replica_id);

    // Call the Tavus API with the correct replica_id
    const response = await fetch(`${TAVUS_API_URL}/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TAVUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script,
        replica_id: userSettings.tavus_replica_id,
        callback_url: `${SUPABASE_URL}/functions/v1/tavus-webhook`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Tavus API error:", data);
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: data.message || "Failed to generate video",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
        },
      });

    if (insertError) {
      console.error("❌ Failed to create persona_content record:", insertError);
      // Don't return error since video was created successfully
    }

    console.log("✅ Successfully created Tavus video:", data.id);

    return new Response(
      JSON.stringify({
        id: data.id,
        status: data.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("⛔️ Unexpected error in create-video function:", error);
    return new Response(
      JSON.stringify({
        id: null,
        status: "failed",
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});