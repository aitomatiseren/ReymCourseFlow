
-- Add more comprehensive mock data for courses
INSERT INTO public.courses (title, description, category, duration_hours, max_participants, price, code95_points) VALUES
('Advanced Machinery Operation', 'Advanced training for heavy machinery operators', 'Equipment', 20.0, 8, 650.00, 18),
('Workplace Safety Assessment', 'Comprehensive workplace safety evaluation training', 'Safety', 14.0, 15, 300.00, 12),
('Chemical Handling Procedures', 'Safe handling and storage of hazardous chemicals', 'Technical', 10.0, 12, 275.00, 8),
('Emergency Evacuation Training', 'Emergency response and evacuation procedures', 'Safety', 6.0, 25, 125.00, 5),
('Quality Control Systems', 'Introduction to quality management systems', 'Technical', 16.0, 10, 400.00, 0),
('Team Leadership Skills', 'Essential leadership skills for team supervisors', 'Management', 32.0, 6, 950.00, 0),
('Health & Safety Compliance', 'Understanding and implementing H&S regulations', 'Safety', 12.0, 18, 225.00, 10);

-- Add more training sessions for the next few months
INSERT INTO public.trainings (course_id, title, instructor, date, time, location, max_participants, status, requires_approval) 
SELECT 
  c.id,
  c.title || ' - March Session',
  'Peter van Dijk',
  '2025-03-10'::date,
  '10:00'::time,
  'Training Center B, Utrecht',
  c.max_participants,
  'scheduled',
  false
FROM public.courses c WHERE c.title = 'First Aid & Emergency Response';

INSERT INTO public.trainings (course_id, title, instructor, date, time, location, max_participants, status, requires_approval) 
SELECT 
  c.id,
  c.title || ' - February Session',
  'Anna Bakker',
  '2025-02-28'::date,
  '13:30'::time,
  'Workshop C, Eindhoven',
  c.max_participants,
  'confirmed',
  true
FROM public.courses c WHERE c.title = 'Advanced Machinery Operation';

INSERT INTO public.trainings (course_id, title, instructor, date, time, location, max_participants, status, requires_approval) 
SELECT 
  c.id,
  c.title || ' - January Session',
  'Tom Hendriks',
  '2025-01-25'::date,
  '09:30'::time,
  'Safety Training Room, Rotterdam',
  c.max_participants,
  'completed',
  false
FROM public.courses c WHERE c.title = 'Workplace Safety Assessment';

-- Add training participants (enrollments)
INSERT INTO public.training_participants (training_id, employee_id, status, approval_status)
SELECT 
  t.id,
  e.id,
  'enrolled',
  CASE WHEN t.requires_approval THEN 'approved' ELSE NULL END
FROM public.trainings t
CROSS JOIN public.employees e
WHERE t.title LIKE '%VCA%' AND e.employee_number IN ('EMP001', 'EMP002', 'EMP005');

INSERT INTO public.training_participants (training_id, employee_id, status, approval_status)
SELECT 
  t.id,
  e.id,
  'attended',
  'approved'
FROM public.trainings t
CROSS JOIN public.employees e
WHERE t.title LIKE '%Workplace Safety%' AND e.employee_number IN ('EMP002', 'EMP004');

INSERT INTO public.training_participants (training_id, employee_id, status, approval_status)
SELECT 
  t.id,
  e.id,
  'enrolled',
  'pending'
FROM public.trainings t
CROSS JOIN public.employees e
WHERE t.title LIKE '%Forklift%' AND e.employee_number IN ('EMP001', 'EMP003', 'EMP005');

-- Add more employee licenses with varying expiry dates
INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2022-05-15'::date,
  '2025-05-15'::date,
  'BHV-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP002' AND l.name = 'BHV';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2021-12-01'::date,
  '2024-12-01'::date,
  'HDO-' || e.employee_number,
  'expiring'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP005' AND l.name = 'HDO';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2020-08-20'::date,
  '2023-08-20'::date,
  'VCA-' || e.employee_number,
  'expired'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP003' AND l.name = 'VCA';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-09-10'::date,
  '2026-09-10'::date,
  'FLT-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP005' AND l.name = 'Forklift';

-- Add more employees for a richer dataset
INSERT INTO public.employees (name, email, department, employee_number, job_title, phone, date_of_birth, hire_date, status, address, postcode, city, country, contract_type, work_location) VALUES
('Lisa Jansen', 'lisa.jansen@company.com', 'Safety', 'EMP006', 'Safety Inspector', '+31 6 77889900', '1987-12-03', '2021-09-15', 'active', 'Stationsplein 44', '2011 LM', 'Haarlem', 'Netherlands', 'permanent', 'Haarlem Office'),
('Robert Smit', 'robert.smit@company.com', 'Operations', 'EMP007', 'Shift Supervisor', '+31 6 22334455', '1983-06-18', '2018-04-20', 'active', 'Parkweg 67', '3512 JA', 'Utrecht', 'Netherlands', 'permanent', 'Utrecht Facility'),
('Maria Santos', 'maria.santos@company.com', 'Administration', 'EMP008', 'Training Coordinator', '+31 6 66778899', '1991-02-28', '2023-01-10', 'active', 'Lange Voorhout 12', '2514 ED', 'Den Haag', 'Netherlands', 'temporary', 'Den Haag Office'),
('Ahmed Hassan', 'ahmed.hassan@company.com', 'Maintenance', 'EMP009', 'Equipment Technician', '+31 6 44556677', '1989-09-14', '2020-11-05', 'active', 'Westerstraat 89', '1015 LZ', 'Amsterdam', 'Netherlands', 'permanent', 'Amsterdam Office'),
('Sophie Mueller', 'sophie.mueller@company.com', 'Operations', 'EMP010', 'Quality Controller', '+31 6 33445566', '1986-04-07', '2019-08-12', 'inactive', 'Breestraat 156', '2311 CS', 'Leiden', 'Netherlands', 'permanent', 'Leiden Facility');

-- Assign licenses to new employees
INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2024-01-15'::date,
  '2027-01-15'::date,
  'SI-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP006' AND l.name = 'Safety Inspector';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-11-20'::date,
  '2028-11-20'::date,
  'VCA-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP007' AND l.name = 'VCA';

INSERT INTO public.employee_licenses (employee_id, license_id, issue_date, expiry_date, certificate_number, status) 
SELECT 
  e.id, 
  l.id, 
  '2023-02-10'::date,
  '2026-02-10'::date,
  'BHV-' || e.employee_number,
  'valid'
FROM public.employees e, public.licenses l 
WHERE e.employee_number = 'EMP008' AND l.name = 'BHV';
