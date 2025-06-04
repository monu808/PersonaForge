import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
const TAVUS_API_URL = "https://api.tavus.io/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // 1️⃣ Handle preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // 2️⃣ Parse body
    const { personaId, script } = await req.json();

    if (!personaId || !script) {
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: "Missing required parameters",
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

    // 3️⃣ ENSURE KEY IS SET (If TAVUS_API_KEY is undefined, fetch will almost certainly fail)
    if (!TAVUS_API_KEY) {
      console.error("⛔️ TAVUS_API_KEY is undefined or missing!");
      return new Response(
        JSON.stringify({
          id: null,
          status: "failed",
          error: "Server misconfigured: missing TAVUS_API_KEY",
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

    // 4️⃣ Call the Tavus API
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

    // 5️⃣ If the network/fetch fails (e.g. DNS, key missing, or Tavus is down),
    //     it jumps to the catch block below. Only if we get a valid HTTP response do we parse JSON.
    const data = await response.json();

    if (!response.ok) {
      // 6️⃣ Tavus responded with a 4xx or 5xx. Return failure to client.
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

    // 7️⃣ Success from Tavus. Send back the ID+status.
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
    // 8️⃣ Any other error (fetch threw, JSON parsing blew up, etc.)
    console.error("⛔️ create-video function caught:", error);
    return new Response(
      JSON.stringify({
        id: null,
        status: "failed",
        error: error.message || "An unexpected error occurred",
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
