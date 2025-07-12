-- Add cost breakdown functionality to courses table
-- This migration adds a JSONB column to store multiple cost components
-- while keeping the existing price column for backward compatibility

-- Add cost_breakdown column to store detailed cost information
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '[]'::jsonb;

-- Migrate existing price data to cost_breakdown structure
UPDATE public.courses 
SET cost_breakdown = jsonb_build_array(
  jsonb_build_object(
    'name', 'Course Fee',
    'amount', COALESCE(price, 0),
    'description', 'Total course price'
  )
)
WHERE price IS NOT NULL AND price > 0 AND cost_breakdown = '[]'::jsonb;

-- Add comment to describe the structure
COMMENT ON COLUMN public.courses.cost_breakdown IS 'Array of cost components: [{"name": "Theory Training", "amount": 150.00, "description": "Theoretical instruction"}, {"name": "Exam", "amount": 50.00, "description": "Final examination"}]';

-- Update the price column to be calculated from cost_breakdown when needed
-- (We'll handle this in the application layer for now)