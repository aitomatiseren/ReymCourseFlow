
-- Add columns to support multi-session training
ALTER TABLE public.trainings 
ADD COLUMN session_dates jsonb,
ADD COLUMN sessions_count integer DEFAULT 1,
ADD COLUMN session_times jsonb,
ADD COLUMN session_end_times jsonb;

-- Update existing records to have default values
UPDATE public.trainings 
SET sessions_count = 1 
WHERE sessions_count IS NULL;
