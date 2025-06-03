import { serve } from "npm:@supabase/functions-js@2.2.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    // Get the Tavus API key from environment variable
    const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
    if (!TAVUS_API_KEY) {
      throw new Error("TAVUS_API_KEY environment variable not set");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    const url = new URL(req.url);
    const videoId = url.searchParams.get("id");
    
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Video ID is required" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 400 
      });
    }

    // Call Tavus API to check video status
    const response = await fetch(`https://api.tavus.io/v2/videos/${videoId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${TAVUS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    // Update our database with the current status
    if (response.ok) {
      const { error: updateError } = await supabase
        .from("persona_content")
        .update({
          metadata: {
            ...data,
            status: data.status,
            last_checked: new Date().toISOString()
          }
        })
        .eq("content", videoId);
        
      if (updateError) {
        console.error("Failed to update video status:", updateError);
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    });
  } catch (error) {
    console.error("Tavus API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});