
-- Add birth place and birth country fields to the employees table
ALTER TABLE public.employees 
ADD COLUMN birth_place text,
ADD COLUMN birth_country text;
