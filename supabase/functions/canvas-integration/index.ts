import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { canvasUrl, apiToken, action } = await req.json();

    if (!canvasUrl || !apiToken) {
      throw new Error("Canvas URL and API token are required");
    }

    let endpoint = "";
    switch (action) {
      case "courses":
        endpoint = "/api/v1/courses";
        break;
      case "assignments":
        // Use the todo endpoint which returns all pending assignments across all courses
        endpoint = "/api/v1/users/self/todo";
        break;
      default:
        throw new Error("Invalid action");
    }

    const response = await fetch(`${canvasUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in canvas-integration:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
