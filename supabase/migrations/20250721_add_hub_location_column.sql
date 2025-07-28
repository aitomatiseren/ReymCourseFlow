-- Add hub_location column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hub_location VARCHAR(255);

-- Set initial hub_location values based on city (temporary data migration)
UPDATE employees 
SET hub_location = city 
WHERE hub_location IS NULL AND city IS NOT NULL;

-- Update employees with empty/null hub_location to have a default value
UPDATE employees 
SET hub_location = 'Main Hub' 
WHERE hub_location IS NULL OR hub_location = '';

-- Add index for better performance on hub_location searches
CREATE INDEX IF NOT EXISTS idx_employees_hub_location ON employees(hub_location);