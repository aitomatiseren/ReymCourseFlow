-- Update course_providers table to use JSONB for structured location data
-- This migration changes additional_locations from TEXT[] to JSONB to support 
-- structured location objects with name, address, postcode, city, country

-- First, create a backup column
ALTER TABLE public.course_providers 
ADD COLUMN IF NOT EXISTS additional_locations_backup TEXT[];

-- Copy existing data to backup
UPDATE public.course_providers 
SET additional_locations_backup = additional_locations
WHERE additional_locations IS NOT NULL;

-- Drop the old column and recreate with JSONB type
ALTER TABLE public.course_providers 
DROP COLUMN IF EXISTS additional_locations;

ALTER TABLE public.course_providers 
ADD COLUMN additional_locations JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data from backup (convert simple strings to structured objects)
UPDATE public.course_providers 
SET additional_locations = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', location_name,
      'address', '',
      'postcode', '',
      'city', '',
      'country', 'Netherlands'
    )
  )
  FROM unnest(additional_locations_backup) AS location_name
)
WHERE additional_locations_backup IS NOT NULL 
  AND array_length(additional_locations_backup, 1) > 0;

-- Clean up backup column (optional - uncomment to remove)
-- ALTER TABLE public.course_providers DROP COLUMN additional_locations_backup;

-- Update any NULL values to empty JSON array
UPDATE public.course_providers 
SET additional_locations = '[]'::jsonb
WHERE additional_locations IS NULL;