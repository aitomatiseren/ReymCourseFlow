
-- Add missing columns to the trainings table
ALTER TABLE public.trainings 
ADD COLUMN price numeric,
ADD COLUMN notes text,
ADD COLUMN checklist jsonb DEFAULT '[]'::jsonb;
