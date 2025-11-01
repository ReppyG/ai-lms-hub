import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { conversationId, message, stream = true } = await req.json();
    console.log('Premium chat request:', { conversationId, userId: user.id, stream });

    // Get user preferences
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const model = preferences?.preferred_model || 'google/gemini-2.5-flash';
    const customInstructions = preferences?.custom_instructions || '';

    // Get conversation history if conversationId provided
    let messages = [];
    if (conversationId) {
      const { data: conversationMessages } = await supabaseClient
        .from('conversation_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      messages = conversationMessages || [];
    }

    // Add system message with custom instructions
    const systemMessage = {
      role: 'system',
      content: `You are a premium AI assistant with advanced capabilities. ${customInstructions ? `\n\nUser's custom instructions: ${customInstructions}` : ''}`
    };

    // Add new user message
    messages.push({ role: 'user', content: message });

    // Save user message to database
    const { data: savedMessage } = await supabaseClient
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'user',
        content: message
      })
      .select()
      .single();

    console.log('Calling Lovable AI with model:', model);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, ...messages],
        stream,
        max_tokens: preferences?.max_tokens || 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Track usage
    supabaseClient.from('usage_analytics').insert({
      user_id: user.id,
      action_type: 'premium_chat',
      metadata: { model, conversationId }
    }).then();

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    } else {
      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Save assistant response
      await supabaseClient
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: 'assistant',
          content: assistantMessage
        });

      return new Response(JSON.stringify({ response: assistantMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in premium-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});