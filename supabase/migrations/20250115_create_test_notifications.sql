-- Create test notifications for the admin user
-- First, let's find the admin user's employee ID

DO $$
DECLARE
    admin_employee_id UUID;
    test_employee_id UUID;
BEGIN
    -- Get the admin user's employee ID (admin@admin.com)
    SELECT e.id INTO admin_employee_id
    FROM employees e
    WHERE e.email = 'admin@admin.com'
    LIMIT 1;
    
    -- If admin user doesn't exist, create them
    IF admin_employee_id IS NULL THEN
        INSERT INTO employees (
            name, email, department, employee_number, job_title, phone, 
            date_of_birth, hire_date, status, address, postcode, city, 
            country, contract_type, work_location, first_name, last_name, roepnaam
        ) VALUES (
            'Admin User', 'admin@admin.com', 'Administration', 'EMP100', 'System Administrator', 
            '+31 6 12345000', '1980-01-01', '2020-01-01', 'active', 'Admin Street 1', 
            '1000 AA', 'Amsterdam', 'Netherlands', 'permanent', 'Head Office', 
            'Admin', 'User', 'Admin'
        ) RETURNING id INTO admin_employee_id;
    END IF;
    
    -- Get another employee for testing
    SELECT e.id INTO test_employee_id
    FROM employees e
    WHERE e.email != 'admin@admin.com'
    LIMIT 1;
    
    -- Create test notifications for admin user
    INSERT INTO notifications (recipient_id, type, title, message, priority, action_url) VALUES
    (admin_employee_id, 'certificate_expiry', 'Certificate Expiring Soon', 'Your VCA certificate will expire in 30 days. Please renew it to maintain compliance.', 'high', '/certifications'),
    (admin_employee_id, 'training_reminder', 'Upcoming Training Session', 'You have a Forklift Operation Training scheduled for tomorrow at 09:00.', 'medium', '/training-scheduler'),
    (admin_employee_id, 'system_announcement', 'System Maintenance Notice', 'The system will be under maintenance this weekend from 22:00 to 06:00.', 'low', '/notifications'),
    (admin_employee_id, 'approval_required', 'Training Approval Needed', 'John Doe has requested approval for Advanced Safety Training course.', 'medium', '/participants'),
    (admin_employee_id, 'training_enrollment', 'New Training Enrollment', 'You have been enrolled in the Leadership Development program starting next month.', 'medium', '/dashboard');
    
    -- Create some notifications for other employees too (if they exist)
    IF test_employee_id IS NOT NULL THEN
        INSERT INTO notifications (recipient_id, type, title, message, priority, read) VALUES
        (test_employee_id, 'certificate_expiry', 'Certificate Update Required', 'Please update your safety certificate information.', 'medium', false),
        (test_employee_id, 'training_reminder', 'Training Reminder', 'Safety training session tomorrow at 14:00.', 'low', true);
    END IF;
    
    -- Create a user_profile entry for admin if it doesn't exist
    INSERT INTO user_profiles (id, employee_id, role_id, is_active)
    SELECT 
        '45c69954-d0e7-4457-a26a-0acfebda7064'::UUID, -- This is the UUID from the logs 
        admin_employee_id,
        (SELECT id FROM user_roles WHERE name = 'admin' LIMIT 1),
        true
    ON CONFLICT (id) DO UPDATE SET 
        employee_id = admin_employee_id,
        role_id = (SELECT id FROM user_roles WHERE name = 'admin' LIMIT 1);
        
    RAISE NOTICE 'Test notifications created for admin employee ID: %', admin_employee_id;
END $$; 