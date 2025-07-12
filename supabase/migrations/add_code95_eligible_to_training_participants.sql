-- Add code95_eligible field to training_participants table
ALTER TABLE training_participants 
ADD COLUMN code95_eligible BOOLEAN DEFAULT false;

-- Update existing records based on employee requirements
UPDATE training_participants 
SET code95_eligible = (
  SELECT CASE 
    WHEN e.drivingLicenseC = true 
      OR e.drivingLicenseCE = true 
      OR e.drivingLicenseD = true 
      OR e.drivingLicenseCode95 = true 
    THEN true 
    ELSE false 
  END
  FROM employees e 
  WHERE e.id = training_participants.employee_id
);