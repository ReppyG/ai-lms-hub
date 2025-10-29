import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    if (!authHeader) throw new Error("No authorization header");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Authentication failed");

    // Get last week's date
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Fetch completed tasks from last week
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('agent_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', lastWeek.toISOString())
      .order('completed_at', { ascending: false });

    if (tasksError) throw tasksError;

    // Fetch study sessions
    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', lastWeek.toISOString());

    if (sessionsError) throw sessionsError;

    // Calculate statistics
    const totalStudyTime = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
    const aiToolsUsedCount = tasks?.length || 0;
    const uniqueTopics = new Set();
    sessions?.forEach(s => s.topics_covered?.forEach((t: string) => uniqueTopics.add(t)));

    // Generate insights using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextPrompt = `
User Study Data (Last 7 Days):
- Total study time: ${totalStudyTime} minutes
- AI tools used: ${aiToolsUsedCount} times
- Topics covered: ${Array.from(uniqueTopics).join(', ')}
- Completed tasks: ${tasks?.map(t => t.task_type).join(', ')}

Generate a personalized weekly study digest with:
1. Summary of achievements
2. Study patterns and insights
3. Areas for improvement
4. Specific recommendations for next week
5. Motivational message

Keep it concise but encouraging.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are an encouraging AI study coach. Provide personalized, actionable insights based on student data." 
          },
          { role: "user", content: contextPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) throw new Error("AI API error");

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    const digest = {
      weekOf: lastWeek.toISOString(),
      statistics: {
        totalStudyTime,
        aiToolsUsed: aiToolsUsedCount,
        topicsCovered: Array.from(uniqueTopics),
        completedTasks: tasks?.length || 0
      },
      tasks: tasks || [],
      sessions: sessions || [],
      insights,
      generatedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(digest), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
