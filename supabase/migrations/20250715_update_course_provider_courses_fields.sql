-- Update course_provider_courses table to replace location and duration_hours with number_of_sessions
-- This migration aligns with the provider form changes

-- Add number_of_sessions column to store the number of sessions required for each course
ALTER TABLE public.course_provider_courses 
ADD COLUMN IF NOT EXISTS number_of_sessions INTEGER DEFAULT 1 CHECK (number_of_sessions >= 1 AND number_of_sessions <= 20);

-- Remove location column as it's no longer needed in provider-specific course data
-- (Location information is now handled by the provider's additional_locations)
ALTER TABLE public.course_provider_courses 
DROP COLUMN IF EXISTS location;

-- Remove duration_hours column as it's provider-specific and replaced by number_of_sessions
-- (Duration hours is still available in the main courses table)
ALTER TABLE public.course_provider_courses 
DROP COLUMN IF EXISTS duration_hours;

-- Add comment to describe the structure
COMMENT ON COLUMN public.course_provider_courses.number_of_sessions IS 'Number of sessions required for this course by this provider (1-20)';