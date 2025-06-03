import { serve } from "npm:@supabase/functions-js@2.2.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface TavusVideoRequest {
  // For script-based videos
  script?: string;
  // For audio-based videos
  audio_file?: string;
  // User ID from our system to track the request
  userId: string;
  // Persona ID for tracking
  personaId: string;
  // Optional metadata for tracking
  metadata?: Record<string, any>;
}

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

    // Parse request body
    const { script, audio_file, userId, personaId, metadata }: TavusVideoRequest = await req.json();

    // Validate request
    if (!script && !audio_file) {
      return new Response(JSON.stringify({ error: "Either script or audio_file must be provided" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 400 
      });
    }

    // Get the user's replica ID from our database
    const { data: userSettings, error: dbError } = await supabase
      .from("user_settings")
      .select("tavus_replica_id")
      .eq("user_id", userId)
      .single();
    
    if (dbError || !userSettings?.tavus_replica_id) {
      // If no replica found, try to create one
      const userName = await getUserName(supabase, userId);
      
      // Create a new replica for the user
      const replicaResponse = await fetch("https://api.tavus.io/v2/replicas", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TAVUS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${userName}'s Replica`,
          description: `Replica for user ${userId}`,
        }),
      });
      
      if (!replicaResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to create a Tavus replica for this user" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        });
      }
      
      const replicaData = await replicaResponse.json();
      
      // Store the new replica ID
      await supabase
        .from("user_settings")
        .update({ 
          tavus_replica_id: replicaData.id,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);
        
      // Set the replica ID for the current request
      var replicaId = replicaData.id;
    } else {
      // Use existing replica ID
      var replicaId = userSettings.tavus_replica_id;
    }

    // Call Tavus API to generate a video
    const response = await fetch("https://api.tavus.io/v2/videos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TAVUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replica_id: replicaId,
        script: script,
        audio_file: audio_file,
        callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/tavus-webhook`,
        metadata: metadata || { user_id: userId },
      }),
    });

    const data = await response.json();
    
    // Store video generation information in our database
    if (response.ok) {
      const { error: insertError } = await supabase
        .from("persona_content")
        .insert({
          persona_id: personaId,
          content_type: "video",
          content: data.id, // Store the Tavus video ID
          metadata: {
            tavus_video_id: data.id,
            status: "pending",
            script: script || "Generated from audio",
            created_at: new Date().toISOString()
          }
        });
        
      if (insertError) {
        console.error("Failed to insert video record:", insertError);
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

// Helper function to get user's name from their profile
async function getUserName(supabase: any, userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      return "New User";
    }
    
    return data.full_name || "New User";
  } catch (e) {
    console.error("Error fetching user name:", e);
    return "New User";
  }
}