import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Task scheduler running...');

    // Get all enabled scheduled tasks that are due
    const now = new Date();
    const { data: tasks, error } = await supabaseClient
      .from('scheduled_tasks')
      .select('*')
      .eq('enabled', true)
      .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`);

    if (error) {
      throw error;
    }

    console.log(`Found ${tasks?.length || 0} tasks to run`);

    for (const task of tasks || []) {
      try {
        console.log('Running task:', task.name);

        let result;

        switch (task.task_type) {
          case 'workflow':
            // Execute workflow
            const workflowResponse = await supabaseClient.functions.invoke('workflow-executor', {
              body: { workflowId: task.parameters.workflowId }
            });
            result = workflowResponse.data;
            break;

          case 'reminder':
            // Send reminder (placeholder)
            result = { message: 'Reminder sent', ...task.parameters };
            break;

          case 'data_sync':
            // Sync data (placeholder)
            result = { message: 'Data synced', ...task.parameters };
            break;

          default:
            result = { error: 'Unknown task type' };
        }

        // Calculate next run time based on cron expression
        // For simplicity, we'll just add 24 hours for daily tasks
        const nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Update task
        await supabaseClient
          .from('scheduled_tasks')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRunAt.toISOString()
          })
          .eq('id', task.id);

        // Log analytics
        await supabaseClient
          .from('usage_analytics')
          .insert({
            user_id: task.user_id,
            action_type: 'scheduled_task',
            metadata: { taskId: task.id, taskType: task.task_type, result }
          });

        console.log('Task completed:', task.name);
      } catch (taskError) {
        console.error(`Error running task ${task.name}:`, taskError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, tasksRun: tasks?.length || 0 }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in task-scheduler function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});