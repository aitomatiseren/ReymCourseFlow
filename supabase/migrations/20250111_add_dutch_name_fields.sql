-- Add Dutch name component fields to employees table
ALTER TABLE public.employees 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN tussenvoegsel TEXT,
ADD COLUMN roepnaam TEXT;

-- Migrate existing name data to new fields
-- This assumes names are in "FirstName [tussenvoegsel] LastName" format
UPDATE public.employees
SET 
  first_name = CASE 
    WHEN name LIKE '% van %' THEN SPLIT_PART(name, ' van ', 1)
    WHEN name LIKE '% de %' THEN SPLIT_PART(name, ' de ', 1)
    WHEN name LIKE '% van der %' THEN SPLIT_PART(name, ' van der ', 1)
    WHEN name LIKE '% van den %' THEN SPLIT_PART(name, ' van den ', 1)
    ELSE SPLIT_PART(name, ' ', 1)
  END,
  last_name = CASE
    WHEN name LIKE '% van %' THEN SPLIT_PART(name, ' van ', 2)
    WHEN name LIKE '% de %' THEN SPLIT_PART(name, ' de ', 2)
    WHEN name LIKE '% van der %' THEN SPLIT_PART(SPLIT_PART(name, ' van der ', 2), ' ', 1)
    WHEN name LIKE '% van den %' THEN SPLIT_PART(SPLIT_PART(name, ' van den ', 2), ' ', 1)
    ELSE SPLIT_PART(name, ' ', -1)
  END,
  tussenvoegsel = CASE
    WHEN name LIKE '% van %' AND name NOT LIKE '% van der %' AND name NOT LIKE '% van den %' THEN 'van'
    WHEN name LIKE '% de %' THEN 'de'
    WHEN name LIKE '% van der %' THEN 'van der'
    WHEN name LIKE '% van den %' THEN 'van den'
    ELSE NULL
  END;

-- Add Ahmed Hassan if he doesn't exist
INSERT INTO public.employees (name, email, department, employee_number, job_title, phone, date_of_birth, hire_date, status, address, postcode, city, country, contract_type, work_location, first_name, last_name, roepnaam) 
VALUES ('Ahmed Hassan', 'ahmed.hassan@company.com', 'Operations', 'EMP006', 'Senior Manager', '+31 6 12345999', '1982-05-20', '2019-03-15', 'active', 'Amsterdamseweg 789', '1010 AB', 'Amsterdam', 'Netherlands', 'permanent', 'Amsterdam Office', 'Ahmed', 'Hassan', 'Ahmed')
ON CONFLICT (email) DO NOTHING;

-- Update specific known employees
UPDATE public.employees 
SET first_name = 'Ahmed', last_name = 'Hassan', roepnaam = 'Ahmed'
WHERE name = 'Ahmed Hassan';

-- For Emma van Berg
UPDATE public.employees 
SET first_name = 'Emma', last_name = 'Berg', tussenvoegsel = 'van', roepnaam = 'Emma'
WHERE name = 'Emma van Berg';

-- For Lucas de Vries
UPDATE public.employees 
SET first_name = 'Lucas', last_name = 'Vries', tussenvoegsel = 'de', roepnaam = 'Lucas'
WHERE name = 'Lucas de Vries';

-- Add policy for new fields
CREATE POLICY "Allow read access to name fields" ON public.employees 
FOR SELECT USING (true);

CREATE POLICY "Allow update name fields" ON public.employees 
FOR UPDATE USING (true);