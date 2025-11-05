-- Fix 1: Restrict profiles visibility to authenticated users and their contacts
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile and contacts"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR id IN (
      SELECT contact_id FROM public.contacts WHERE user_id = auth.uid()
    )
  );

-- Fix 2: Make recordings bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'recordings';

-- Fix 3: Remove unrestricted public access policy on recordings
DROP POLICY IF EXISTS "Recordings are publicly accessible" ON storage.objects;