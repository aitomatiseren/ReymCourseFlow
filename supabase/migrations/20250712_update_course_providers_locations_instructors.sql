-- Add additional_locations and instructors columns to course_providers table
-- Remove default_location column as it's no longer needed

-- Add new columns
ALTER TABLE public.course_providers 
ADD COLUMN IF NOT EXISTS additional_locations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS instructors TEXT[] DEFAULT '{}';

-- Remove default_location column (optional - comment out if you want to keep it for backwards compatibility)
-- ALTER TABLE public.course_providers DROP COLUMN IF EXISTS default_location;

-- Update any existing rows to have empty arrays for new columns
UPDATE public.course_providers 
SET 
    additional_locations = COALESCE(additional_locations, '{}'),
    instructors = COALESCE(instructors, '{}')
WHERE additional_locations IS NULL OR instructors IS NULL;