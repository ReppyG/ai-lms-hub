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

    const { workflowId } = await req.json();
    console.log('Executing workflow:', { workflowId, userId: user.id });

    // Get workflow
    const { data: workflow, error: workflowError } = await supabaseClient
      .from('ai_workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.enabled) {
      throw new Error('Workflow is disabled');
    }

    // Create workflow run
    const { data: run } = await supabaseClient
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        status: 'running'
      })
      .select()
      .single();

    try {
      const steps = workflow.steps as Array<any>;
      const results = [];

      for (const step of steps) {
        console.log('Executing step:', step);

        let stepResult;

        switch (step.type) {
          case 'ai_task':
            // Execute AI task
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: step.model || 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: step.systemPrompt || 'You are a helpful assistant.' },
                  { role: 'user', content: step.prompt }
                ]
              }),
            });

            const aiData = await aiResponse.json();
            stepResult = aiData.choices[0].message.content;
            break;

          case 'web_scrape':
            // Placeholder for web scraping
            stepResult = { message: 'Web scraping not yet implemented', url: step.url };
            break;

          case 'api_call':
            // Make API call
            const apiResponse = await fetch(step.url, {
              method: step.method || 'GET',
              headers: step.headers || {},
              body: step.body ? JSON.stringify(step.body) : undefined
            });
            stepResult = await apiResponse.json();
            break;

          case 'delay':
            // Add delay
            await new Promise(resolve => setTimeout(resolve, step.duration || 1000));
            stepResult = { delayed: step.duration };
            break;

          default:
            stepResult = { error: 'Unknown step type' };
        }

        results.push({
          step: step.name,
          result: stepResult
        });
      }

      // Update workflow run as completed
      await supabaseClient
        .from('workflow_runs')
        .update({
          status: 'completed',
          result: { steps: results },
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      // Update workflow last_run_at
      await supabaseClient
        .from('ai_workflows')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', workflowId);

      // Track usage
      await supabaseClient
        .from('usage_analytics')
        .insert({
          user_id: user.id,
          action_type: 'workflow_execution',
          metadata: { workflowId, steps: results.length }
        });

      return new Response(
        JSON.stringify({ success: true, results }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (stepError) {
      console.error('Workflow execution error:', stepError);

      // Update workflow run as failed
      await supabaseClient
        .from('workflow_runs')
        .update({
          status: 'failed',
          error_message: stepError instanceof Error ? stepError.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      throw stepError;
    }
  } catch (error) {
    console.error('Error in workflow-executor function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});