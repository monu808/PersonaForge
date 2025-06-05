import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const payload = await req.json();
    console.log("Received webhook from Tavus:", payload);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    if (payload.event === "video.completed") {
      const videoData = payload.data;
      
      const { error } = await supabase
        .from("persona_content")
        .update({
          content: videoData.url,
          metadata: {
            tavus_video_id: videoData.id,
            status: "completed",
            video_url: videoData.url,
            completed_at: new Date().toISOString(),
            thumbnail_url: videoData.thumbnail_url,
            duration: videoData.duration
          }
        })
        .eq("content", videoData.id);

      if (error) {
        throw error;
      }
    } else if (payload.event === "video.failed") {
      const videoData = payload.data;
      
      const { error } = await supabase
        .from("persona_content")
        .update({
          metadata: {
            tavus_video_id: videoData.id,
            status: "failed",
            error: videoData.error || "Video generation failed",
            failed_at: new Date().toISOString()
          }
        })
        .eq("content", videoData.id);

      if (error) {
        throw error;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});