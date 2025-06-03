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
      return new Response(
        JSON.stringify({
          id: null,
          status: 'failed',
          error: 'Missing required parameters',
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

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          id: null,
          status: 'failed',
          error: data.message || 'Failed to generate video',
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
    return new Response(
      JSON.stringify({
        id: null,
        status: 'failed',
        error: error.message || 'An unexpected error occurred',
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
});