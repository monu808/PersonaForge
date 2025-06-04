// Tavus API Edge Function
// This function handles all interactions with the Tavus API

import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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
  // Optional metadata for tracking
  metadata?: Record<string, any>;
}

interface TavusReplicaRequest {
  name: string;
  description?: string;
  userId: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

    const url = new URL(req.url);
    const endpoint = url.pathname.split("/").pop();

    // Common headers for Tavus API requests
    const headers = {
      "Authorization": `Bearer ${TAVUS_API_KEY}`,
      "Content-Type": "application/json"
    };

    // Handle different API endpoints
    switch (endpoint) {
      case "create-replica":
        return handleCreateReplica(req, headers);
      case "create-video":
        return handleGenerateVideo(req, headers);
      case "video-status":
        const videoId = url.searchParams.get("id");
        if (!videoId) {
          return new Response(JSON.stringify({ error: "Video ID is required" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 400 
          });
        }
        return handleVideoStatus(videoId, headers);
      default:
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 404 
        });
    }
  } catch (error) {
    console.error("Tavus API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});

async function handleCreateReplica(req: Request, headers: HeadersInit) {
  const { name, description, userId }: TavusReplicaRequest = await req.json();
  
  // Call Tavus API to create a replica
  const response = await fetch("https://api.tavus.io/v2/replicas", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name,
      description: description || `Replica for user ${userId}`,
    }),
  });

  const data = await response.json();

  // Track the replica ID in our database for this user
  if (response.ok) {
    const { error: dbError } = await supabase
      .from("user_settings")
      .update({ 
        tavus_replica_id: data.id,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
      
    if (dbError) {
      console.error("Failed to update user_settings with replica ID:", dbError);
      return new Response(JSON.stringify({ error: "Failed to update user settings" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: response.status,
  });
}

async function handleGenerateVideo(req: Request, headers: HeadersInit) {
  const { script, audio_file, userId, metadata }: TavusVideoRequest = await req.json();

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
    return new Response(JSON.stringify({ error: "No Tavus replica found for this user" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 400 
    });
  }

  try {
    // Call Tavus API to generate a video
    const replicaId = userSettings.tavus_replica_id;
    const response = await fetch("https://api.tavus.io/v2/videos", {
      method: "POST",
      headers,
      body: JSON.stringify({
        replica_id: replicaId,
        script: script,
        audio_file: audio_file,
        callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/tavus-webhook`,
        metadata: metadata || { user_id: userId },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate video');
    }

    const data = await response.json();
    
    // Store video generation information in our database
    const { error: insertError } = await supabase
      .from("persona_content")
      .insert({
        persona_id: metadata?.persona_id,
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
      return new Response(JSON.stringify({ error: "Failed to save video record" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    });
  } catch (error) {
    console.error("Error generating video:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate video" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

async function handleVideoStatus(videoId: string, headers: HeadersInit) {
  try {
    // Call Tavus API to check video status
    const response = await fetch(`https://api.tavus.io/v2/videos/${videoId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get video status');
    }

    const data = await response.json();
    
    // Update our database with the current status
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
      return new Response(JSON.stringify({ error: "Failed to update video status" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    });
  } catch (error) {
    console.error("Error checking video status:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to check video status" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}