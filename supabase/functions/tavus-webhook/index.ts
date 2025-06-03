import { serve } from "npm:@supabase/functions-js@2.2.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }
  
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }
  
  try {
    // Parse the webhook payload
    const payload = await req.json();
    
    console.log("Received webhook from Tavus:", payload);
    
    // Verify the webhook secret if you've set one up with Tavus
    const tavusWebhookSecret = Deno.env.get("TAVUS_WEBHOOK_SECRET");
    const signature = req.headers.get("x-tavus-signature");
    
    if (tavusWebhookSecret && signature) {
      // Implement signature verification here if needed
      // This would validate the request is actually from Tavus
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Process the webhook based on the event type
    if (payload.event === "video.completed") {
      const videoData = payload.data;
      
      // Update the persona_content table with the completed video information
      const { error } = await supabase
        .from("persona_content")
        .update({
          content: videoData.url, // Update with the actual video URL
          metadata: {
            tavus_video_id: videoData.id,
            status: "completed",
            video_url: videoData.url,
            completed_at: new Date().toISOString(),
            thumbnail_url: videoData.thumbnail_url,
            duration: videoData.duration
          }
        })
        .eq("content", videoData.id); // Find by the Tavus video ID we stored earlier
      
      if (error) {
        console.error("Failed to update video record:", error);
        return new Response(JSON.stringify({ error: "Database update failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
      
      // You could send notifications to the user here
    } else if (payload.event === "video.failed") {
      // Handle failed video generation
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
        console.error("Failed to update failed video record:", error);
      }
    }
    
    // Acknowledge the webhook
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});