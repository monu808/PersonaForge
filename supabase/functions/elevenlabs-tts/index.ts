import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    return new Response("ok", { headers: corsHeaders, status: 200, });
  }
  
  try {
    // Parse request body
    const { text, voiceId, model, voiceSettings, userId } = await req.json();
    
    // Validate required parameters
    if (!text) {
      throw new Error("Missing required parameter: text");
    }
    
    // Default voice ID if not provided
    const voice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Eleven Labs default voice (Rachel)
    const voiceModel = model || "eleven_monolingual_v1";
    
    // Call Eleven Labs API for text-to-speech
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: voiceModel,
        voice_settings: voiceSettings || {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });
    
    // Check for errors
    if (!response.ok) {
      let errorMsg = "Failed to generate speech";
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (e) {
        // If can't parse JSON, use the status text
        errorMsg = `Failed to generate speech: ${response.statusText} (${response.status})`;
      }
      throw new Error(errorMsg);
    }
      // Get the audio data
    const audioData = await response.arrayBuffer();
    
    // In a production environment, we'd upload this to storage using Supabase Storage
    // Here's a placeholder for the implementation:
    //
    // const filePath = `audio/${userId}/${Date.now()}.mp3`;
    // const { data, error } = await supabaseAdmin.storage
    //   .from('persona-content')
    //   .upload(filePath, audioData, {
    //     contentType: 'audio/mpeg',
    //     cacheControl: '3600'
    //   });
    //
    // if (error) {
    //   throw new Error(`Failed to upload audio: ${error.message}`);
    // }
    // 
    // const { data: publicUrlData } = supabaseAdmin.storage
    //   .from('persona-content')
    //   .getPublicUrl(filePath);
    // 
    // const audioUrl = publicUrlData.publicUrl;
    
    // For demo purposes, we'll create a base64 data URL
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;
      // Return success with audio URL
    return new Response(
      JSON.stringify({
        status: "success",
        audioUrl: dataUrl
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
    
  } catch (error) {
    console.error("Error generating speech:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        status: "failed",
        error: error.message || "An unexpected error occurred",
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
