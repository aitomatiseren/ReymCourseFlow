-- Fix course_certificates unique constraint to remove grants_level reference
-- and use the new directly_grants field instead

-- Drop the old constraint that references grants_level
ALTER TABLE public.course_certificates 
DROP CONSTRAINT IF EXISTS course_certificates_course_id_license_id_grants_level_key;

-- Add new unique constraint using course_id and license_id only
-- This ensures one certificate can only be linked to one course once
ALTER TABLE public.course_certificates 
ADD CONSTRAINT course_certificates_course_id_license_id_key 
UNIQUE (course_id, license_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT course_certificates_course_id_license_id_key ON public.course_certificates IS 'Ensures a course can only be linked to a specific certificate once';