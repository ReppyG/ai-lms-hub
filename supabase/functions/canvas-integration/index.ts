import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action } = await req.json();

    // Get credentials from database
    const { data: credentials, error: credError } = await supabaseClient
      .from('canvas_credentials')
      .select('canvas_url, api_token')
      .eq('user_id', user.id)
      .single();

    if (credError || !credentials) {
      throw new Error('Canvas credentials not found. Please configure in Settings.');
    }

    const { canvas_url: canvasUrl, api_token: apiToken } = credentials;

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
