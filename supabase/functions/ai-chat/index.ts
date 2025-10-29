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
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with Canvas context
    let systemPrompt = "You are a helpful AI study assistant for students. Help them with homework, studying, and understanding concepts. Be concise and educational.";
    
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
    
    systemPrompt += "\n\nWhen answering questions about assignments or deadlines, always reference the specific assignment names, courses, and due dates from the context above. Be specific and helpful.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: systemPrompt
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
