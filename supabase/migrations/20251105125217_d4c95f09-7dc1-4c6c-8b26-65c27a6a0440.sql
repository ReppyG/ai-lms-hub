-- Add recording columns to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER;