-- Add cost_breakdown column to course_provider_courses table
-- This column was referenced in TypeScript types and provider cost analysis view but was missing from the schema

ALTER TABLE public.course_provider_courses 
ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '[]'::jsonb;

-- Add comment to describe the structure
COMMENT ON COLUMN public.course_provider_courses.cost_breakdown IS 'Array of cost components: [{"name": "Theory Training", "amount": 150.00, "description": "Theoretical instruction"}, {"name": "Exam", "amount": 50.00, "description": "Final examination"}]';

-- Migrate existing price data to cost_breakdown structure where price exists
UPDATE public.course_provider_courses 
SET cost_breakdown = jsonb_build_array(
    jsonb_build_object(
        'name', 'Course Fee',
        'amount', price,
        'description', 'Standard course fee'
    )
)
WHERE price IS NOT NULL AND price > 0 AND cost_breakdown = '[]'::jsonb;