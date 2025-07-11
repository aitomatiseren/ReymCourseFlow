-- Fix training_participants schema to ensure all required fields exist

-- First, ensure the table has all required columns
ALTER TABLE public.training_participants
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_participants_training_id ON public.training_participants(training_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_employee_id ON public.training_participants(employee_id);

-- Ensure RLS policies are properly set up (if not already done)
-- The policies already exist from previous migrations, so we don't need to recreate them

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_training_participants_updated_at ON public.training_participants;
CREATE TRIGGER update_training_participants_updated_at 
BEFORE UPDATE ON public.training_participants 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();