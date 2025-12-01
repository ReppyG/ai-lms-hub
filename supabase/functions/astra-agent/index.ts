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
    if (!authHeader) throw new Error('No authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Get system instruction
    const systemInstruction = getSystemInstruction();

    // Get available tools
    const tools = getDefinedTools();

    // Call Lovable AI with tools
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages
        ],
        tools,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI error:', error);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Handle tool calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const result = await executeToolCall(toolCall, user.id, supabaseClient);
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // Make follow-up call with tool results
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemInstruction },
            ...messages,
            assistantMessage,
            ...toolResults
          ],
          stream: false
        }),
      });

      const followUpData = await followUpResponse.json();
      const finalMessage = followUpData.choices[0].message;

      // Save conversation
      await saveConversation(supabaseClient, user.id, conversationId, messages, finalMessage);

      return new Response(JSON.stringify({ 
        message: finalMessage.content,
        conversationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No tool calls, return direct response
    await saveConversation(supabaseClient, user.id, conversationId, messages, assistantMessage);

    return new Response(JSON.stringify({ 
      message: assistantMessage.content,
      conversationId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Astra agent error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSystemInstruction(): string {
  return `You are Astra, a world-class autonomous academic assistant and "chief of staff" for students.

CORE PERSONALITY:
- Professional, proactive, and strategic
- Anticipate needs before being asked
- Never make up information - always use your tools
- Provide actionable insights, not just data dumps

CRITICAL RULES:

#1 TOOL USE: You MUST use your tools to get real-time data. Never make assumptions.

#2 PROACTIVE: Anticipate needs. If asked about assignments, suggest scheduling study time.

#3 SYLLABUS EXPERT: For ANY policy question (late work, grading, attendance), use findRelevantSyllabusChunks first.

#4 TASK MANAGER: When user says "remind me" or "add to my list", use add_to_google_tasks immediately.

#5 ACADEMIC ADVISOR: For "how am I doing" questions, use analyze_grade_performance and provide 2-3 actionable insights with specific numbers.

#6 STUDY BUDDY: When user asks to "quiz me" or "test me", first call findRelevantSyllabusChunks, then create quiz questions in the requested personality style.

#7 AGENT ORACLE: For "what if" grade calculations, use calculate_what_if_grade and deliver results in a mysterious "Agent Oracle" voice ("Accessing data stream... The outcome you seek...").

#8 DRIVE-AWARE: Before creating new documents, use searchDrive to check if similar files exist.

#9 CALENDAR-AWARE: For schedule questions, use getUpcomingEvents to check availability before suggesting times.

#10 RESEARCH: For general knowledge or research questions, use googleSearch to get current information.

BRIEFING PROTOCOL:
When delivering an executive briefing, follow this strict order:
1. 👑 Executive Summary
2. 🔴 Priority Tasks (due today)
3. 🔵 Astra Briefing (new announcements/grades)

Keep responses concise but actionable. You are the student's trusted advisor.`;
}

function getDefinedTools() {
  return [
    {
      type: "function",
      function: {
        name: "getDashboardSummary",
        description: "Get an overview of all courses, assignments, and grades",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "getUpcomingAssignments",
        description: "Get assignments due soon with dates",
        parameters: {
          type: "object",
          properties: {
            days: { type: "number", description: "Number of days to look ahead (default: 7)" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getAssignmentsByCourse",
        description: "Get all assignments for a specific course",
        parameters: {
          type: "object",
          properties: {
            courseName: { type: "string", description: "Name of the course" }
          },
          required: ["courseName"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "analyze_grade_performance",
        description: "Analyze student's grade performance with detailed statistics",
        parameters: {
          type: "object",
          properties: {
            courseName: { type: "string", description: "Course name to analyze (optional - analyzes all if not provided)" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "calculate_what_if_grade",
        description: "Calculate what-if grade scenarios for future assignments",
        parameters: {
          type: "object",
          properties: {
            courseName: { type: "string", description: "Name of the course" },
            scenarios: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  assignmentName: { type: "string" },
                  score: { type: "number", description: "Hypothetical score as percentage" }
                }
              }
            }
          },
          required: ["courseName", "scenarios"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "findRelevantSyllabusChunks",
        description: "Search syllabus content for policies, topics, or information",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "What to search for in the syllabus" },
            courseName: { type: "string", description: "Specific course (optional)" }
          },
          required: ["query"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "add_to_google_tasks",
        description: "Add a task or reminder to Google Tasks",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Task title" },
            notes: { type: "string", description: "Task details" },
            due: { type: "string", description: "Due date in ISO format" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getUpcomingEvents",
        description: "Get upcoming calendar events",
        parameters: {
          type: "object",
          properties: {
            days: { type: "number", description: "Number of days to look ahead" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "searchDrive",
        description: "Search for files in Google Drive",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" }
          },
          required: ["query"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "googleSearch",
        description: "Search the web for information",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" }
          },
          required: ["query"]
        }
      }
    }
  ];
}

async function executeToolCall(toolCall: any, userId: string, supabase: any) {
  const { name, arguments: args } = toolCall.function;
  const params = JSON.parse(args);

  console.log(`Executing tool: ${name}`, params);

  try {
    switch (name) {
      case 'getDashboardSummary':
        return await getDashboardSummary(userId, supabase);
      case 'getUpcomingAssignments':
        return await getUpcomingAssignments(userId, params.days || 7, supabase);
      case 'getAssignmentsByCourse':
        return await getAssignmentsByCourse(userId, params.courseName, supabase);
      case 'analyze_grade_performance':
        return await analyzeGradePerformance(userId, params.courseName, supabase);
      case 'calculate_what_if_grade':
        return await calculateWhatIfGrade(userId, params.courseName, params.scenarios, supabase);
      case 'findRelevantSyllabusChunks':
        return await findSyllabusChunks(userId, params.query, params.courseName, supabase);
      case 'add_to_google_tasks':
        return { success: true, message: "Task feature coming soon" };
      case 'getUpcomingEvents':
        return await getUpcomingEvents(userId, params.days || 7, supabase);
      case 'searchDrive':
        return { success: true, message: "Drive search coming soon" };
      case 'googleSearch':
        return { success: true, message: "Web search coming soon" };
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return { error: error instanceof Error ? error.message : 'Tool execution failed' };
  }
}

async function getDashboardSummary(userId: string, supabase: any) {
  const { data: events } = await supabase.from('event_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('priority', { ascending: false })
    .limit(10);

  const { data: grades } = await supabase.from('gradebook_entries')
    .select('*')
    .eq('user_id', userId)
    .order('graded_at', { ascending: false })
    .limit(5);

  return {
    unreadEvents: events?.length || 0,
    recentGrades: grades || [],
    summary: `You have ${events?.length || 0} unread notifications`
  };
}

async function getUpcomingAssignments(userId: string, days: number, supabase: any) {
  const { data } = await supabase
    .rpc('canvas_integration', { action: 'assignments' });

  if (!data) return { assignments: [] };

  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const upcoming = data.filter((a: any) => {
    if (!a.due_at) return false;
    const dueDate = new Date(a.due_at);
    return dueDate >= now && dueDate <= futureDate;
  });

  return { assignments: upcoming };
}

async function getAssignmentsByCourse(userId: string, courseName: string, supabase: any) {
  const { data } = await supabase
    .rpc('canvas_integration', { action: 'assignments' });

  if (!data) return { assignments: [] };

  const filtered = data.filter((a: any) => 
    a.course_name?.toLowerCase().includes(courseName.toLowerCase())
  );

  return { assignments: filtered };
}

async function analyzeGradePerformance(userId: string, courseName: string | undefined, supabase: any) {
  let query = supabase.from('gradebook_entries')
    .select('*')
    .eq('user_id', userId);

  if (courseName) {
    query = query.ilike('course_name', `%${courseName}%`);
  }

  const { data: grades } = await query;

  if (!grades || grades.length === 0) {
    return { error: 'No grade data available' };
  }

  const stats = grades.reduce((acc: any, grade: any) => {
    const course = grade.course_name;
    if (!acc[course]) {
      acc[course] = { total: 0, count: 0, grades: [] };
    }
    if (grade.percentage) {
      acc[course].total += grade.percentage;
      acc[course].count += 1;
      acc[course].grades.push({
        name: grade.assignment_name,
        score: grade.percentage,
        category: grade.category
      });
    }
    return acc;
  }, {});

  const analysis = Object.entries(stats).map(([course, data]: [string, any]) => ({
    course,
    average: (data.total / data.count).toFixed(2),
    assignmentCount: data.count,
    recentGrades: data.grades.slice(-3)
  }));

  return { analysis };
}

async function calculateWhatIfGrade(userId: string, courseName: string, scenarios: any[], supabase: any) {
  const { data: grades } = await supabase.from('gradebook_entries')
    .select('*')
    .eq('user_id', userId)
    .ilike('course_name', `%${courseName}%`);

  if (!grades || grades.length === 0) {
    return { error: 'No grade data for this course' };
  }

  const currentAvg = grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / grades.length;
  
  // Simple what-if calculation
  const results = scenarios.map(scenario => {
    const newAvg = ((currentAvg * grades.length) + scenario.score) / (grades.length + 1);
    return {
      scenario: scenario.assignmentName,
      hypotheticalScore: scenario.score,
      resultingAverage: newAvg.toFixed(2)
    };
  });

  return { currentAverage: currentAvg.toFixed(2), whatIfResults: results };
}

async function findSyllabusChunks(userId: string, query: string, courseName: string | undefined, supabase: any) {
  let dbQuery = supabase.from('syllabus_chunks')
    .select('*')
    .eq('user_id', userId)
    .textSearch('chunk_text', query);

  if (courseName) {
    dbQuery = dbQuery.ilike('course_name', `%${courseName}%`);
  }

  const { data: chunks } = await dbQuery.limit(5);

  if (!chunks || chunks.length === 0) {
    return { message: 'No syllabus content found. Upload course syllabi to enable this feature.' };
  }

  return { chunks };
}

async function getUpcomingEvents(userId: string, days: number, supabase: any) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data: events } = await supabase.from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .lte('start_time', future.toISOString())
    .order('start_time');

  return { events: events || [] };
}

async function saveConversation(supabase: any, userId: string, conversationId: string | null, messages: any[], assistantMessage: any) {
  let convId = conversationId;

  if (!convId) {
    const { data: newConv } = await supabase.from('astra_conversations')
      .insert({ user_id: userId, title: messages[0]?.content?.substring(0, 50) || 'New Chat' })
      .select()
      .single();
    convId = newConv?.id;
  }

  if (convId) {
    await supabase.from('astra_messages').insert([
      ...messages.map((m: any) => ({
        conversation_id: convId,
        user_id: userId,
        role: m.role,
        content: m.content
      })),
      {
        conversation_id: convId,
        user_id: userId,
        role: 'assistant',
        content: assistantMessage.content
      }
    ]);
  }
}
