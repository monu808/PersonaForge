import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts"; // Assuming shared CORS headers

const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
const TAVUS_API_URL = "https://api.tavus.io/v2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ensure request body is valid JSON
    let train_video_url: string | undefined;
    let replica_name: string | undefined;
    let callback_url: string | undefined;

    try {
      const body = await req.json();
      train_video_url = body.train_video_url;
      replica_name = body.replica_name; // Optional
      callback_url = body.callback_url; // Optional
    } catch (e) {
      throw new Error("Invalid JSON body");
    }

    // Validate required parameters
    if (!train_video_url) {
      throw new Error("Missing required parameter: train_video_url");
    }

    // Construct request body for Tavus API
    const tavusBody: { [key: string]: any } = {
      train_video_url: train_video_url,
    };
    if (replica_name) {
      tavusBody.replica_name = replica_name;
    }
    if (callback_url) {
      tavusBody.callback_url = callback_url;
    }

    // Call Tavus API to create replica
    const response = await fetch(`${TAVUS_API_URL}/replicas`, {
      method: "POST",
      headers: {
        "x-api-key": TAVUS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tavusBody),
    });

    const data = await response.json();

    // Check for API errors
    if (!response.ok) {
      console.error("Tavus API Error:", data);
      throw new Error(data.message || `Failed to create replica (HTTP ${response.status})`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        replica_id: data.replica_id,
        status: data.status,
        message: "Replica creation initiated successfully."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    // Return error response
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, // Use 400 for client-side errors, 500 for server-side
      }
    );
  }
});

