-- Add min_participants column to course_provider_courses table
-- This supports per-course minimum group size configuration

-- Add the min_participants column to the course_provider_courses table
ALTER TABLE public.course_provider_courses 
ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1 CHECK (min_participants >= 1);

-- Update any existing records to have a default value of 1
UPDATE public.course_provider_courses 
SET min_participants = 1 
WHERE min_participants IS NULL;