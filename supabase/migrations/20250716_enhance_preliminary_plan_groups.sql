-- Migration: Enhance preliminary_plan_groups table
-- Description: Add additional fields for planned dates, provider recommendation, and sessions required

-- Add new columns to preliminary_plan_groups table
ALTER TABLE public.preliminary_plan_groups 
ADD COLUMN IF NOT EXISTS planned_start_date DATE,
ADD COLUMN IF NOT EXISTS planned_end_date DATE,
ADD COLUMN IF NOT EXISTS provider_recommendation VARCHAR,
ADD COLUMN IF NOT EXISTS sessions_required INTEGER;

-- Add comment for the new columns
COMMENT ON COLUMN public.preliminary_plan_groups.planned_start_date IS 'Planned start date for the training group';
COMMENT ON COLUMN public.preliminary_plan_groups.planned_end_date IS 'Planned end date for the training group (for multi-session trainings)';
COMMENT ON COLUMN public.preliminary_plan_groups.provider_recommendation IS 'AI-recommended provider for this training group';
COMMENT ON COLUMN public.preliminary_plan_groups.sessions_required IS 'Number of sessions required for this training group';