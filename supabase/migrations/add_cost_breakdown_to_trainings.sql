-- Add cost_breakdown column to trainings table
ALTER TABLE trainings 
ADD COLUMN cost_breakdown JSON;

-- Add comment to explain the structure
COMMENT ON COLUMN trainings.cost_breakdown IS 'JSON array of cost components with name, amount, and description fields';

-- Example of the expected JSON structure:
-- [
--   {"name": "Theory", "amount": 100, "description": "Theoretical training session"},
--   {"name": "Exam", "amount": 50, "description": "Practical examination"}
-- ] 