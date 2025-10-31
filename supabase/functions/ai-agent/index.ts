import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[AI-AGENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Request received", { method: req.method, url: req.url });

    // Parse request body with error handling
    let requestBody;
    try {
      const text = await req.text();
      logStep("Request body received", { length: text.length });
      requestBody = JSON.parse(text);
    } catch (parseError) {
      logStep("JSON parse error", { error: String(parseError) });
      throw new Error("Invalid JSON in request body");
    }

    const { taskType, prompt, context } = requestBody;
    
    if (!taskType) {
      throw new Error("taskType is required");
    }
    if (!prompt) {
      throw new Error("prompt is required");
    }
    
    logStep("Received request", { taskType });
    
    // Check authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("Missing env vars", { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      throw new Error("Missing Supabase configuration");
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("Auth error", { error: userError.message });
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error("Authentication failed: No user found");
    }
    
    logStep("User authenticated", { userId: user.id });

    // Create task record
    const { data: task, error: taskError } = await supabaseClient
      .from('agent_tasks')
      .insert({
        user_id: user.id,
        task_type: taskType,
        prompt: prompt,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (taskError) {
      logStep("Task creation error", { error: taskError.message });
      throw new Error(`Failed to create task: ${taskError.message}`);
    }
    
    logStep("Task created", { taskId: task.id });

    // Build system prompt based on task type
    let systemPrompt = "You are an AI study assistant for students.";
    let userPrompt = prompt;
    
    // Add Canvas context to system prompt if available
    if (context?.assignments && context.assignments.length > 0) {
      const upcomingAssignments = context.assignments
        .filter((a: any) => a.due_at)
        .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
        .slice(0, 10);
      
      systemPrompt += "\n\nThe student's upcoming assignments:";
      upcomingAssignments.forEach((assignment: any) => {
        const course = context.courses?.find((c: any) => c.id === assignment.course_id);
        const dueDate = new Date(assignment.due_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        systemPrompt += `\n- "${assignment.name}" for ${course?.name || 'Unknown Course'} - Due: ${dueDate}${assignment.points_possible ? ` (${assignment.points_possible} points)` : ''}`;
        if (assignment.description) {
          systemPrompt += `\n  Description: ${assignment.description.substring(0, 150)}${assignment.description.length > 150 ? '...' : ''}`;
        }
      });
    }
    
    if (context?.courses && context.courses.length > 0) {
      systemPrompt += "\n\nThe student's enrolled courses:";
      context.courses.forEach((course: any) => {
        systemPrompt += `\n- ${course.name}${course.course_code ? ` (${course.course_code})` : ''}`;
      });
    }

    switch (taskType) {
      case 'study_plan':
        systemPrompt = `You are an expert study planner. Create detailed, actionable study plans with specific time allocations, learning objectives, and milestones. Format your response as JSON with this structure:
{
  "title": "Study Plan Title",
  "totalHours": 10,
  "steps": [
    {"title": "Step name", "description": "What to do", "duration": 2, "topics": ["topic1", "topic2"]},
  ],
  "milestones": [
    {"title": "Milestone", "date": "YYYY-MM-DD", "description": "What to achieve"}
  ],
  "tips": ["tip1", "tip2"]
}`;
        if (context?.assignments) {
          userPrompt += `\n\nUpcoming assignments:\n${context.assignments.map((a: any) => `- ${a.name} (due: ${a.due_at})`).join('\n')}`;
        }
        break;

      case 'summarize_notes':
        systemPrompt = `You are an expert at summarizing study materials. Create clear, concise summaries with:
- Key concepts and definitions
- Important points numbered
- Examples where relevant
- Connections between ideas
Format as structured markdown.`;
        break;

      case 'generate_quiz':
        systemPrompt = `You are an expert quiz creator. Generate educational quizzes in JSON format:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}
Include 5-10 questions of varying difficulty.`;
        break;

      case 'solve_problem':
        systemPrompt = `You are an expert tutor for STEM subjects. Solve problems step-by-step:
1. Understand the problem
2. Identify the approach
3. Show detailed work
4. Explain each step
5. Verify the answer
6. Provide similar practice problems
Use clear mathematical notation and explanations.`;
        break;

      case 'create_flashcards':
        systemPrompt = `You are an expert at creating study flashcards. Generate flashcards in JSON format:
{
  "deck": "Deck Name",
  "cards": [
    {
      "front": "Question or term",
      "back": "Answer or definition",
      "hint": "Optional hint",
      "tags": ["category1", "category2"]
    }
  ]
}
Create 10-20 cards covering key concepts.`;
        break;

      case 'analyze_assignments':
        systemPrompt = `You are an expert at analyzing academic assignments. Provide:
- Priority ranking (high/medium/low)
- Time estimates
- Difficulty assessment
- Suggested approach
- Study tips
- Related concepts to review
Format as structured markdown with clear sections.`;
        if (context?.assignments) {
          userPrompt = `Analyze these assignments:\n${JSON.stringify(context.assignments, null, 2)}`;
        }
        break;
    }

    // Check for Lovable API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      logStep("Missing LOVABLE_API_KEY");
      throw new Error("LOVABLE_API_KEY not configured");
    }

    logStep("Calling Lovable AI", { model: "google/gemini-2.5-flash" });
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API Error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      logStep("Invalid AI response structure", { aiData });
      throw new Error("Invalid response from AI API");
    }
    
    const result = aiData.choices[0].message.content;
    logStep("AI response received", { resultLength: result.length });

    // Try to parse as JSON for structured tasks
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = { content: result, type: 'text' };
    }

    // Update task with result
    const { error: updateError } = await supabaseClient
      .from('agent_tasks')
      .update({
        result: parsedResult,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', task.id);

    if (updateError) {
      logStep("Task update error", { error: updateError.message });
      throw new Error(`Failed to update task: ${updateError.message}`);
    }
    
    logStep("Task completed successfully");

    return new Response(JSON.stringify({
      taskId: task.id,
      status: 'completed',
      result: parsedResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logStep("ERROR", { 
      message: errorMessage,
      stack: errorStack,
      type: typeof error 
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
