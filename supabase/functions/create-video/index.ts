import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
const TAVUS_API_URL = "https://api.tavus.io/v2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    console.log("📣 TAVUS_API_KEY at runtime:", TAVUS_API_KEY ? "Present" : "Missing");
    
    const { personaId, script, audio_url } = await req.json();

    if (!personaId || (!script && !audio_url)) {
      throw new Error('Missing required parameters: personaId and either script or audio_url');
    }

    // Call Tavus API to generate video
    const response = await fetch(`${TAVUS_API_URL}/videos`, {
      method: "POST",
      headers: {
        "x-api-key": TAVUS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replica_id: personaId,
        ...(script && { script }),
        ...(audio_url && { audio_url }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return new Response(
      JSON.stringify({
        id: data.video_id,
        status: data.status || 'pending',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating video:", error);
    
    return new Response(
      JSON.stringify({
        id: null,
        status: 'failed',
        error: error.message || 'Failed to generate video',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});