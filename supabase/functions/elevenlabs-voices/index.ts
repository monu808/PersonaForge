import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Call Eleven Labs API to get voices
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: "GET",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      let errorMsg = "Failed to fetch voices";
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (e) {
        errorMsg = `Failed to fetch voices: ${response.statusText} (${response.status})`;
      }
      throw new Error(errorMsg);
    }
    
    const voicesData = await response.json();
    
    // Format the response to match our application's needs
    const formattedVoices = voicesData.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category || "general",
      description: voice.description || "",
      previewUrl: voice.preview_url || ""
    }));
    
    // Return the list of voices
    return new Response(
      JSON.stringify({
        status: "success",
        voices: formattedVoices
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
    
  } catch (error) {
    console.error("Error fetching voices:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        status: "failed",
        error: error.message || "An unexpected error occurred",
        voices: []
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400, // Bad request
      }
    );
  }
});
