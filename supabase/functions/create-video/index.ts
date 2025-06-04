import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
const TAVUS_API_URL = "https://api.tavus.io/v2";

// Log the API key status (but not the key itself) for debugging
console.log("📣 TAVUS_API_KEY at runtime:", TAVUS_API_KEY ? "Present" : "Missing");

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
    // Check API key before processing request
    if (!TAVUS_API_KEY) {
      console.error("⛔️ TAVUS_API_KEY is not configured in environment!");
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: "TAVUS_API_KEY is not configured. Please contact support.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
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
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("🎥 Attempting to create Tavus video for persona:", personaId);

    // Call the Tavus API
    const response = await fetch(`${TAVUS_API_URL}/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TAVUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script,
        replica_id: personaId,
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
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("✅ Successfully created Tavus video:", data.id);

    return new Response(
      JSON.stringify({
        id: data.id,
        status: data.status,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});