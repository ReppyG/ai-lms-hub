-- Create enum for agent task types
CREATE TYPE public.agent_task_type AS ENUM (
  'study_plan',
  'summarize_notes',
  'generate_quiz',
  'solve_problem',
  'create_flashcards',
  'analyze_assignments'
);

-- Create enum for task status
CREATE TYPE public.agent_task_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

-- Create agent_tasks table
CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type agent_task_type NOT NULL,
  prompt TEXT NOT NULL,
  result JSONB,
  status agent_task_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_tasks
CREATE POLICY "Users can view their own agent tasks"
ON public.agent_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent tasks"
ON public.agent_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent tasks"
ON public.agent_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent tasks"
ON public.agent_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_agent_tasks_user_status ON public.agent_tasks(user_id, status);
CREATE INDEX idx_agent_tasks_scheduled ON public.agent_tasks(scheduled_for) WHERE status = 'pending';

-- Create trigger for updated_at
CREATE TRIGGER update_agent_tasks_updated_at
BEFORE UPDATE ON public.agent_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create study_sessions table for analytics
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT,
  assignment_name TEXT,
  duration_minutes INTEGER,
  topics_covered TEXT[],
  ai_tools_used TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_sessions
CREATE POLICY "Users can view their own study sessions"
ON public.study_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
ON public.study_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for analytics queries
CREATE INDEX idx_study_sessions_user_created ON public.study_sessions(user_id, created_at DESC);