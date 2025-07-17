-- Remove category column from courses table
-- This migration removes the category classification system from courses

-- Drop the category column from the courses table
ALTER TABLE public.courses 
DROP COLUMN IF EXISTS category;

-- Update any views or functions that might reference the category column
-- Note: This is a safe operation as we've already updated the frontend to not use categories

-- No data migration needed as we're simply removing the column