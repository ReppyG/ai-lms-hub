import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Transcription Request Started ===");
    
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

    console.log("User authenticated:", user.id);

    const { audioUrl, noteId } = await req.json();

    if (!audioUrl || !noteId) {
      throw new Error("Missing audioUrl or noteId");
    }

    console.log("Downloading audio from:", audioUrl);
    console.log("Note ID:", noteId);

    // Download audio file with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const audioResponse = await fetch(audioUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!audioResponse.ok) {
      throw new Error(`Download failed: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    const audioSize = audioBlob.size;
    console.log("Audio downloaded:", audioSize, "bytes");

    if (audioSize === 0) {
      throw new Error("Audio file is empty");
    }

    // Detect audio format from headers, blob type or URL extension
    const contentType = audioResponse.headers.get('content-type') || audioBlob.type || '';
    let audioFormat = 'webm';
    if (contentType.includes('mp3') || audioUrl.includes('.mp3')) audioFormat = 'mp3';
    else if (contentType.includes('wav') || audioUrl.includes('.wav')) audioFormat = 'wav';
    else if (contentType.includes('ogg') || audioUrl.includes('.ogg')) audioFormat = 'ogg';
    else if (contentType.includes('m4a') || audioUrl.includes('.m4a')) audioFormat = 'm4a';
    else if (contentType.includes('mp4') || audioUrl.includes('.mp4')) audioFormat = 'mp4';
    else if (contentType.includes('webm') || audioUrl.includes('.webm')) audioFormat = 'webm';
    console.log("Detected audio format:", audioFormat, "(content-type:", contentType, ")");

    // Convert to base64 using Deno std to avoid corruption and check payload size
    const audioBuffer = await audioBlob.arrayBuffer();
    const bytes = new Uint8Array(audioBuffer);

    // Guard against oversized payloads (keep well below ~20MB request limit)
    const MAX_BYTES = 12 * 1024 * 1024; // 12 MB binary -> ~16MB base64 + JSON overhead
    if (bytes.length > MAX_BYTES) {
      console.warn("Audio too large for inline transcription:", bytes.length, "bytes");
      return new Response(
        JSON.stringify({
          error: "Audio too large for transcription. Please record a shorter clip or lower recording quality.",
          limit_mb: 12,
          success: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 413 }
      );
    }

    const audioBase64 = base64Encode(audioBuffer);
    console.log("Base64 encoded (std), length:", audioBase64.length);

    // Call Lovable AI with Gemini for transcription
    console.log("Calling Gemini API...");
    
    const transcriptionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0.1, // small randomness helps ASR on noisy inputs
        top_p: 0.1,
        messages: [
          {
            role: "system",
            content: "You are an expert transcription assistant. Only transcribe the spoken words verbatim. Do NOT summarize, translate, or add commentary. If audio is unclear, output [inaudible]. If the audio seems cut off, output [truncated]. Preserve punctuation, capitalization, and paragraph breaks. Keep the original language."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio recording accurately:" },
              { type: "audio", audio: { data: audioBase64, format: audioFormat } }
            ]
          }
        ],
        max_tokens: 4096
      }),
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("Gemini error:", transcriptionResponse.status, errorText);
      if (transcriptionResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded by AI gateway. Please try again shortly.", success: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
      if (transcriptionResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required for AI usage. Please add credits to your workspace.", success: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }
      throw new Error(`Transcription API error: ${transcriptionResponse.status}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    console.log("Gemini response received");

    if (!transcriptionData.choices?.[0]?.message?.content) {
      console.error("Invalid response:", JSON.stringify(transcriptionData));
      throw new Error("No transcription in response");
    }

    const transcription = transcriptionData.choices[0].message.content.trim();
    console.log("Transcription length:", transcription.length, "characters");

    if (transcription.length < 3) {
      throw new Error("Transcription too short - audio may be silent or corrupted");
    }

    // Update note with transcription
    const { error: updateError } = await supabase
      .from("notes")
      .update({ transcription })
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to save transcription");
    }

    console.log("=== Transcription Complete ===");

    return new Response(
      JSON.stringify({ 
        transcription,
        length: transcription.length,
        success: true
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("=== Transcription Error ===");
    console.error(error);
    
    let errorMessage = "Transcription failed";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
