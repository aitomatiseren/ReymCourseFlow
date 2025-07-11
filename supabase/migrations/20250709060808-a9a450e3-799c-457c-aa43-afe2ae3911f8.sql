
-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  employee_number TEXT UNIQUE NOT NULL,
  job_title TEXT,
  phone TEXT,
  mobile_phone TEXT,
  date_of_birth DATE,
  hire_date DATE,
  status TEXT CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')) DEFAULT 'active',
  address TEXT,
  postcode TEXT,
  city TEXT,
  country TEXT DEFAULT 'Netherlands',
  contract_type TEXT CHECK (contract_type IN ('permanent', 'temporary', 'freelance')) DEFAULT 'permanent',
  work_location TEXT,
  salary DECIMAL(10,2),
  working_hours DECIMAL(4,2) DEFAULT 40.00,
  nationality TEXT,
  personal_id TEXT,
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  manager_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create licenses table
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  validity_period_months INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_licenses junction table
CREATE TABLE public.employee_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
  issue_date DATE,
  expiry_date DATE,
  certificate_number TEXT,
  status TEXT CHECK (status IN ('valid', 'expiring', 'expired')) DEFAULT 'valid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, license_id)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_hours DECIMAL(4,2),
  max_participants INTEGER,
  price DECIMAL(10,2),
  code95_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trainings table (scheduled course instances)
CREATE TABLE public.trainings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructor TEXT,
  instructor_id UUID,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')) DEFAULT 'scheduled',
  requires_approval BOOLEAN DEFAULT false,
  organizer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training_participants table
CREATE TABLE public.training_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('enrolled', 'attended', 'absent', 'cancelled')) DEFAULT 'enrolled',
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(training_id, employee_id)
);

-- Insert mock licenses
INSERT INTO public.licenses (name, description, category, validity_period_months) VALUES
('VCA', 'Veiligheid Checklist Aannemers', 'Safety', 60),
('Forklift', 'Forklift Operation License', 'Equipment', 36),
('Safety Inspector', 'General Safety Inspector Certification', 'Safety', 24),
('Electrical', 'Electrical Work Certification', 'Technical', 60),
('Mechanical', 'Mechanical Systems Certification', 'Technical', 48),
('HDO', 'Heftruckchauffeur Diploma Operator', 'Equipment', 60),
('BHV', 'Bedrijfshulpverlening', 'Safety', 36);

-- Insert mock employees
INSERT INTO public.employees (name, email, department, employee_number, job_title, phone, date_of_birth, hire_date, status, address, postcode, city, country, contract_type, work_location) VALUES
('John Doe', 'john.doe@company.com', 'Operations', 'EMP001', 'Operations Manager', '+31 6 12345678', '1985-03-15', '2020-01-15', 'active', 'Hoofdstraat 123', '1234 AB', 'Amsterdam', 'Netherlands', 'permanent', 'Amsterdam Office'),
('Sarah Wilson', 'sarah.wilson@company.com', 'Safety', 'EMP002', 'Safety Coordinator', '+31 6 87654321', '1990-07-22', '2021-03-01', 'active', 'Kerkstraat 45', '5678 CD', 'Rotterdam', 'Netherlands', 'permanent', 'Rotterdam Office'),
('Mike Johnson', 'mike.johnson@company.com', 'Maintenance', 'EMP003', 'Maintenance Technician', '+31 6 11223344', '1988-11-30', '2019-06-15', 'on_leave', 'Dorpsstraat 78', '9012 EF', 'Utrecht', 'Netherlands', 'permanent', 'Utrecht Facility'),
('Emma van Berg', 'emma.vanberg@company.com', 'Administration', 'EMP004', 'HR Specialist', '+31 6 55443322', '1992-05-12', '2022-02-01', 'active', 'Nieuwstraat 156', '3456 GH', 'Den Haag', 'Netherlands', 'permanent', 'Den Haag Office'),
('Lucas de Vries', 'lucas.devries@company.com', 'Operations', 'EMP005', 'Warehouse Supervisor', '+31 6 99887766', '1987-09-08', '2020-08-10', 'active', 'Industrieweg 89', '7890 IJ', 'Eindhoven', 'Netherlands', 'permanent', 'Eindhoven Warehouse');

-- Assign licenses to employees
INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-01-15'::date,
  '2025-01-15'::date,
  'VCA-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP001' AND l.name = 'VCA';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-02-01'::date,
  '2026-02-01'::date,
  'FLT-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP001' AND l.name = 'Forklift';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-03-01'::date,
  '2025-03-01'::date,
  'SI-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP002' AND l.name = 'Safety Inspector';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-01-10'::date,
  '2028-01-10'::date,
  'ELC-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP003' AND l.name = 'Electrical';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-06-15'::date,
  '2027-06-15'::date,
  'MCH-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP003' AND l.name = 'Mechanical';

-- Insert mock courses
INSERT INTO public.courses (title, description, category, duration_hours, max_participants, price, code95_points) VALUES
('VCA Basic Safety Course', 'Basic safety awareness training for construction and industrial environments', 'Safety', 8.0, 20, 150.00, 7),
('Forklift Operation Training', 'Complete training program for forklift operation and safety', 'Equipment', 16.0, 12, 450.00, 14),
('First Aid & Emergency Response', 'Basic first aid and emergency response procedures', 'Safety', 12.0, 15, 200.00, 10),
('Electrical Safety Workshop', 'Safety procedures for electrical work environments', 'Technical', 6.0, 10, 175.00, 5),
('Leadership Development', 'Management and leadership skills for supervisors', 'Management', 24.0, 8, 800.00, 0);

-- Insert mock training sessions
INSERT INTO public.trainings (course_id, title, instructor, date, time, location, max_participants, status, requires_approval) 
SELECT 
  c.id,
  c.title || ' - January Session',
  'Jan van der Berg',
  '2025-01-20'::date,
  '09:00'::time,
  'Training Room A, Amsterdam',
  c.max_participants,
  'scheduled',
  false
FROM public.courses c WHERE c.title = 'VCA Basic Safety Course';

INSERT INTO public.trainings (course_id, title, instructor, date, time, location, max_participants, status, requires_approval) 
SELECT 
  c.id,
  c.title || ' - February Session',
  'Maria Hendriks',
  '2025-02-15'::date,
  '08:30'::time,
  'Workshop Floor, Rotterdam',
  c.max_participants,
  'scheduled',
  true
FROM public.courses c WHERE c.title = 'Forklift Operation Training';

-- Enable Row Level Security (for future use)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access for now (can be restricted later when auth is added)
CREATE POLICY "Allow read access to employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow read access to licenses" ON public.licenses FOR SELECT USING (true);
CREATE POLICY "Allow read access to employee_licenses" ON public.employee_licenses FOR SELECT USING (true);
CREATE POLICY "Allow read access to courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow read access to trainings" ON public.trainings FOR SELECT USING (true);
CREATE POLICY "Allow read access to training_participants" ON public.training_participants FOR SELECT USING (true);

-- Allow insert/update/delete for now (can be restricted later)
CREATE POLICY "Allow insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow delete employees" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Allow insert employee_licenses" ON public.employee_licenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update employee_licenses" ON public.employee_licenses FOR UPDATE USING (true);
CREATE POLICY "Allow delete employee_licenses" ON public.employee_licenses FOR DELETE USING (true);
