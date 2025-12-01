-- Astra Config Table for storing settings, API keys, and autonomous run summaries
CREATE TABLE IF NOT EXISTS public.astra_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Astra Conversations for chat interface
CREATE TABLE IF NOT EXISTS public.astra_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false
);

-- Astra Messages for chat history
CREATE TABLE IF NOT EXISTS public.astra_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.astra_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Event Queue for priority tasks and briefing items
CREATE TABLE IF NOT EXISTS public.event_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('PRIORITY_TASK', 'BRIEFING', 'GRADE_ALERT')),
  priority integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Syllabus Chunks for text search (vector search can be added later with pgvector)
CREATE TABLE IF NOT EXISTS public.syllabus_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  course_name text NOT NULL,
  chunk_text text NOT NULL,
  chunk_index integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Gradebook Entries for grade analytics
CREATE TABLE IF NOT EXISTS public.gradebook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id text NOT NULL,
  course_id text NOT NULL,
  course_name text NOT NULL,
  assignment_name text NOT NULL,
  category text,
  weight numeric,
  points_earned numeric,
  points_possible numeric,
  percentage numeric,
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, assignment_id)
);

-- Google Calendar Events cache
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  summary text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  is_study_slot boolean NOT NULL DEFAULT false,
  assignment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, google_event_id)
);

-- Enable RLS on all tables
ALTER TABLE public.astra_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astra_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astra_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for astra_config
CREATE POLICY "Users can manage their own config"
  ON public.astra_config FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for astra_conversations
CREATE POLICY "Users can manage their own conversations"
  ON public.astra_conversations FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for astra_messages
CREATE POLICY "Users can manage their own messages"
  ON public.astra_messages FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for event_queue
CREATE POLICY "Users can manage their own events"
  ON public.event_queue FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for syllabus_chunks
CREATE POLICY "Users can manage their own syllabus chunks"
  ON public.syllabus_chunks FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for gradebook_entries
CREATE POLICY "Users can manage their own gradebook"
  ON public.gradebook_entries FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY "Users can manage their own calendar events"
  ON public.calendar_events FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_astra_config_user_key ON public.astra_config(user_id, key);
CREATE INDEX idx_astra_messages_conversation ON public.astra_messages(conversation_id, created_at DESC);
CREATE INDEX idx_event_queue_user_priority ON public.event_queue(user_id, priority DESC, created_at DESC) WHERE NOT is_read;
CREATE INDEX idx_syllabus_chunks_course ON public.syllabus_chunks(user_id, course_id);
CREATE INDEX idx_syllabus_chunks_text ON public.syllabus_chunks USING gin(to_tsvector('english', chunk_text));
CREATE INDEX idx_gradebook_course ON public.gradebook_entries(user_id, course_id);
CREATE INDEX idx_calendar_events_time ON public.calendar_events(user_id, start_time);

-- Update triggers
CREATE TRIGGER update_astra_config_updated_at
  BEFORE UPDATE ON public.astra_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_astra_conversations_updated_at
  BEFORE UPDATE ON public.astra_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gradebook_updated_at
  BEFORE UPDATE ON public.gradebook_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();