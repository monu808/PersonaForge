import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
const TAVUS_API_URL = "https://api.tavus.io/v1";

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
    });
  }

  try {
    const { personaId, script } = await req.json();

    if (!personaId || !script) {
      throw new Error("Missing required parameters");
    }

    // Call Tavus API to generate video
    const response = await fetch(`${TAVUS_API_URL}/videos`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TAVUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script,
        replicaId: personaId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to generate video");
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});