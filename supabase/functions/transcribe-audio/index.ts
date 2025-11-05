import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseKey || !lovableApiKey) {
      throw new Error("Missing configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const { audioUrl, noteId } = await req.json();

    console.log("Transcribing audio from:", audioUrl);

    // Download audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error("Failed to download audio");
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Use Gemini for transcription
    const transcriptionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a transcription assistant. Transcribe the audio accurately, including proper punctuation and formatting. If you hear a lecture or teaching, organize it into clear sections."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe this audio recording:"
              },
              {
                type: "audio",
                audio: {
                  data: audioBase64,
                  format: "webm"
                }
              }
            ]
          }
        ]
      }),
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("Transcription error:", errorText);
      throw new Error("Transcription failed");
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcription = transcriptionData.choices[0].message.content;

    // Update note with transcription
    const { error: updateError } = await supabase
      .from("notes")
      .update({ transcription })
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update note");
    }

    return new Response(
      JSON.stringify({ transcription }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
