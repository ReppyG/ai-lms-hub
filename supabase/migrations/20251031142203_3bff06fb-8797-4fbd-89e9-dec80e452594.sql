-- Add missing task types used by the UI to the enum agent_task_type
-- These values are required for AssignmentActionsDropdown and StudyTools
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'analyze';
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'summarize';
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'outline';
