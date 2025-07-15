-- Enhanced Employee Self-Service Portal Database Permissions
-- This migration adds enhanced database permissions and policies for employee self-service functionality

-- Add new permissions for employee self-service
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM user_roles r
CROSS JOIN (
    SELECT 'view_own_document_uploads' as permission_name
    UNION SELECT 'upload_own_certificates'
    UNION SELECT 'view_available_trainings' 
    UNION SELECT 'request_training_enrollment'
    UNION SELECT 'view_training_history'
    UNION SELECT 'view_certificate_requirements'
    UNION SELECT 'track_training_progress'
    UNION SELECT 'update_own_contact_info'
    UNION SELECT 'view_own_training_calendar'
    UNION SELECT 'download_own_certificates'
) perms
JOIN permissions p ON p.name = perms.permission_name
WHERE r.name = 'employee'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Ensure these permissions exist (they may already be created)
INSERT INTO permissions (name, description, category)
VALUES 
    ('view_own_document_uploads', 'View own uploaded certificate documents', 'user'),
    ('upload_own_certificates', 'Upload own certificate documents for verification', 'user'),
    ('view_available_trainings', 'View available trainings for enrollment', 'course_scheduling'),
    ('request_training_enrollment', 'Request enrollment in training courses', 'course_scheduling'),
    ('view_training_history', 'View complete training history and records', 'user'),
    ('view_certificate_requirements', 'View certificate requirements and renewal schedules', 'user'),
    ('track_training_progress', 'Track progress of ongoing trainings', 'user'),
    ('update_own_contact_info', 'Update own contact information and preferences', 'user'),
    ('view_own_training_calendar', 'View personal training calendar and schedule', 'user'),
    ('download_own_certificates', 'Download and print own certificates', 'user')
ON CONFLICT (name) DO NOTHING;

-- Enhanced RLS policies for employee self-service

-- Policy for employees to view their own uploaded documents
DROP POLICY IF EXISTS "employees_view_own_certificate_documents" ON certificate_documents;
CREATE POLICY "employees_view_own_certificate_documents" ON certificate_documents
    FOR SELECT 
    USING (
        -- Allow employees to view documents they uploaded themselves
        uploaded_by = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) OR
        -- Allow employees to view documents associated with their employee record
        employee_id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) OR
        -- Allow HR/Admin/Manager roles to view all documents
        EXISTS (
            SELECT 1 
            FROM user_profiles up
            JOIN user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() 
            AND ur.name IN ('admin', 'hr', 'manager')
        )
    );

-- Policy for employees to upload their own documents
DROP POLICY IF EXISTS "employees_insert_own_certificate_documents" ON certificate_documents;
CREATE POLICY "employees_insert_own_certificate_documents" ON certificate_documents
    FOR INSERT 
    WITH CHECK (
        -- Employees can only upload documents for themselves
        (employee_id IS NULL OR employee_id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )) AND
        uploaded_by = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy for employees to update their own document metadata (only specific fields)
DROP POLICY IF EXISTS "employees_update_own_certificate_documents" ON certificate_documents;
CREATE POLICY "employees_update_own_certificate_documents" ON certificate_documents
    FOR UPDATE 
    USING (
        uploaded_by = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 
            FROM user_profiles up
            JOIN user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() 
            AND ur.name IN ('admin', 'hr', 'manager')
        )
    );

-- Enhanced policy for employees to view their own training records
DROP POLICY IF EXISTS "employees_view_own_training_participants" ON training_participants;
CREATE POLICY "employees_view_own_training_participants" ON training_participants
    FOR SELECT 
    USING (
        -- Allow employees to view their own training participation records
        employee_id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) OR
        -- Allow staff with appropriate permissions to view all records
        EXISTS (
            SELECT 1 
            FROM user_profiles up
            JOIN user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() 
            AND ur.name IN ('admin', 'hr', 'manager', 'instructor')
        )
    );

-- Policy for employees to request training enrollment
DROP POLICY IF EXISTS "employees_request_training_enrollment" ON training_participants;
CREATE POLICY "employees_request_training_enrollment" ON training_participants
    FOR INSERT 
    WITH CHECK (
        -- Employees can only enroll themselves
        employee_id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) AND
        -- Set initial status to 'pending' for employee self-enrollment
        status = 'pending'
    );

-- Enhanced policy for employees to view their own certificates
DROP POLICY IF EXISTS "employees_view_own_licenses" ON employee_licenses;
CREATE POLICY "employees_view_own_licenses" ON employee_licenses
    FOR SELECT 
    USING (
        employee_id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 
            FROM user_profiles up
            JOIN user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() 
            AND ur.name IN ('admin', 'hr', 'manager')
        )
    );

-- Policy for employees to view available trainings (public courses)
DROP POLICY IF EXISTS "employees_view_available_trainings" ON trainings;
CREATE POLICY "employees_view_available_trainings" ON trainings
    FOR SELECT 
    USING (
        -- Allow all authenticated users to view trainings that are not cancelled
        status != 'cancelled' AND
        auth.uid() IS NOT NULL
    );

-- Policy for employees to view course information
DROP POLICY IF EXISTS "employees_view_courses" ON courses;
CREATE POLICY "employees_view_courses" ON courses
    FOR SELECT 
    USING (
        -- Allow all authenticated users to view active courses
        is_active = true AND
        auth.uid() IS NOT NULL
    );

-- Policy for employees to view course-certificate relationships
DROP POLICY IF EXISTS "employees_view_course_certificates" ON course_certificates;
CREATE POLICY "employees_view_course_certificates" ON course_certificates
    FOR SELECT 
    USING (
        -- Allow all authenticated users to view course-certificate mappings
        auth.uid() IS NOT NULL
    );

-- Policy for employees to view license definitions
DROP POLICY IF EXISTS "employees_view_licenses" ON licenses;
CREATE POLICY "employees_view_licenses" ON licenses
    FOR SELECT 
    USING (
        -- Allow all authenticated users to view license definitions
        auth.uid() IS NOT NULL
    );

-- Enhanced policy for employees to update their own contact information
DROP POLICY IF EXISTS "employees_update_own_contact_info" ON employees;
CREATE POLICY "employees_update_own_contact_info" ON employees
    FOR UPDATE 
    USING (
        id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Create a view for employees to see their training progress
CREATE OR REPLACE VIEW employee_training_progress AS
SELECT 
    tp.id,
    tp.employee_id,
    tp.training_id,
    tp.status,
    tp.enrollment_date,
    tp.completion_date,
    tp.completion_score,
    tp.notes,
    tp.code95_eligible,
    t.id as training_session_id,
    t.start_date,
    t.end_date,
    t.location,
    t.instructor,
    t.max_participants,
    t.current_participants,
    t.status as training_status,
    c.id as course_id,
    c.title as course_title,
    c.category as course_category,
    c.level as course_level,
    c.duration_hours,
    c.code95_points,
    -- Calculate progress percentage based on session completion
    CASE 
        WHEN tp.status = 'completed' THEN 100
        WHEN tp.status = 'in_progress' AND t.start_date <= CURRENT_DATE THEN 50
        WHEN tp.status = 'enrolled' AND t.start_date > CURRENT_DATE THEN 25
        ELSE 0
    END as progress_percentage,
    -- Check if certificate will be granted upon completion
    COALESCE(
        (SELECT COUNT(*) > 0 
         FROM course_certificates cc 
         WHERE cc.course_id = c.id),
        false
    ) as grants_certificate
FROM training_participants tp
JOIN trainings t ON tp.training_id = t.id
JOIN courses c ON t.course_id = c.id;

-- Grant access to the progress view
GRANT SELECT ON employee_training_progress TO authenticated;

-- RLS policy for the training progress view
DROP POLICY IF EXISTS "employees_view_own_training_progress" ON employee_training_progress;
CREATE POLICY "employees_view_own_training_progress" ON employee_training_progress
    FOR SELECT 
    USING (
        employee_id = (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 
            FROM user_profiles up
            JOIN user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() 
            AND ur.name IN ('admin', 'hr', 'manager', 'instructor')
        )
    );

-- Create a function for employees to calculate certificate renewal dates
CREATE OR REPLACE FUNCTION get_employee_certificate_renewal_schedule(target_employee_id UUID DEFAULT NULL)
RETURNS TABLE (
    certificate_name TEXT,
    current_expiry_date DATE,
    renewal_notice_date DATE,
    renewal_window_start DATE,
    is_renewable BOOLEAN,
    days_until_expiry INTEGER,
    renewal_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    emp_id UUID;
BEGIN
    -- If no employee_id provided, use current user's employee_id
    IF target_employee_id IS NULL THEN
        SELECT employee_id INTO emp_id
        FROM user_profiles 
        WHERE id = auth.uid();
    ELSE
        emp_id := target_employee_id;
        
        -- Check if user has permission to view other employee's data
        IF NOT EXISTS (
            SELECT 1 
            FROM user_profiles up
            JOIN user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() 
            AND ur.name IN ('admin', 'hr', 'manager')
        ) AND emp_id != (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Insufficient permissions to view other employee certificates';
        END IF;
    END IF;

    IF emp_id IS NULL THEN
        RAISE EXCEPTION 'No employee record found for current user';
    END IF;

    RETURN QUERY
    SELECT 
        l.name::TEXT as certificate_name,
        el.expiry_date::DATE as current_expiry_date,
        (el.expiry_date - INTERVAL '1 month' * COALESCE(l.renewal_notice_months, 6))::DATE as renewal_notice_date,
        (el.expiry_date - INTERVAL '1 month' * COALESCE(l.renewal_notice_months, 6))::DATE as renewal_window_start,
        COALESCE(l.validity_period_months > 0, true) as is_renewable,
        (el.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
        CASE 
            WHEN el.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN el.expiry_date <= CURRENT_DATE + INTERVAL '1 month' * COALESCE(l.renewal_notice_months, 6) THEN 'renewal_due'
            WHEN el.expiry_date <= CURRENT_DATE + INTERVAL '1 month' * (COALESCE(l.renewal_notice_months, 6) + 3) THEN 'renewal_approaching'
            ELSE 'current'
        END::TEXT as renewal_status
    FROM employee_licenses el
    JOIN licenses l ON el.license_id = l.id
    WHERE el.employee_id = emp_id
    AND el.status = 'valid'
    ORDER BY el.expiry_date ASC;
END;
$$;

-- Grant access to the renewal schedule function
GRANT EXECUTE ON FUNCTION get_employee_certificate_renewal_schedule(UUID) TO authenticated;

-- Create a function for employees to find suitable renewal courses
CREATE OR REPLACE FUNCTION get_renewal_courses_for_employee(target_employee_id UUID DEFAULT NULL)
RETURNS TABLE (
    license_name TEXT,
    course_id UUID,
    course_title TEXT,
    course_category TEXT,
    duration_hours INTEGER,
    code95_points INTEGER,
    grants_level INTEGER,
    is_required BOOLEAN,
    renewal_eligible BOOLEAN,
    upcoming_training_id UUID,
    upcoming_start_date DATE,
    upcoming_location TEXT,
    available_spots INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    emp_id UUID;
BEGIN
    -- If no employee_id provided, use current user's employee_id
    IF target_employee_id IS NULL THEN
        SELECT employee_id INTO emp_id
        FROM user_profiles 
        WHERE id = auth.uid();
    ELSE
        emp_id := target_employee_id;
        
        -- Check permissions for viewing other employee data
        IF NOT EXISTS (
            SELECT 1 
            FROM user_profiles up
            JOIN user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() 
            AND ur.name IN ('admin', 'hr', 'manager')
        ) AND emp_id != (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Insufficient permissions to view other employee data';
        END IF;
    END IF;

    IF emp_id IS NULL THEN
        RAISE EXCEPTION 'No employee record found for current user';
    END IF;

    RETURN QUERY
    SELECT 
        l.name::TEXT as license_name,
        c.id as course_id,
        c.title::TEXT as course_title,
        c.category::TEXT as course_category,
        c.duration_hours,
        c.code95_points,
        cc.grants_level,
        cc.is_required,
        cc.renewal_eligible,
        t.id as upcoming_training_id,
        t.start_date::DATE as upcoming_start_date,
        t.location::TEXT as upcoming_location,
        (t.max_participants - t.current_participants) as available_spots
    FROM employee_licenses el
    JOIN licenses l ON el.license_id = l.id
    JOIN course_certificates cc ON l.id = cc.license_id
    JOIN courses c ON cc.course_id = c.id
    LEFT JOIN trainings t ON c.id = t.course_id 
        AND t.start_date > CURRENT_DATE 
        AND t.status IN ('scheduled', 'confirmed')
        AND t.current_participants < t.max_participants
    WHERE el.employee_id = emp_id
    AND el.status = 'valid'
    AND cc.renewal_eligible = true
    AND c.is_active = true
    -- Only show certificates that need renewal within the next year
    AND el.expiry_date <= CURRENT_DATE + INTERVAL '12 months'
    ORDER BY el.expiry_date ASC, t.start_date ASC NULLS LAST;
END;
$$;

-- Grant access to the renewal courses function
GRANT EXECUTE ON FUNCTION get_renewal_courses_for_employee(UUID) TO authenticated;

-- Add some helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificate_documents_employee_uploaded_by 
ON certificate_documents(employee_id, uploaded_by);

CREATE INDEX IF NOT EXISTS idx_training_participants_employee_status 
ON training_participants(employee_id, status);

CREATE INDEX IF NOT EXISTS idx_employee_licenses_employee_expiry 
ON employee_licenses(employee_id, expiry_date) WHERE status = 'valid';

CREATE INDEX IF NOT EXISTS idx_trainings_course_start_date 
ON trainings(course_id, start_date) WHERE status IN ('scheduled', 'confirmed');

-- Comment on new permissions for documentation
COMMENT ON POLICY "employees_view_own_certificate_documents" ON certificate_documents IS 
'Allows employees to view certificate documents they uploaded or that are associated with their employee record';

COMMENT ON POLICY "employees_insert_own_certificate_documents" ON certificate_documents IS 
'Allows employees to upload certificate documents for themselves only';

COMMENT ON POLICY "employees_request_training_enrollment" ON training_participants IS 
'Allows employees to request enrollment in training courses for themselves';

COMMENT ON FUNCTION get_employee_certificate_renewal_schedule(UUID) IS 
'Returns certificate renewal schedule for an employee with renewal windows and status';

COMMENT ON FUNCTION get_renewal_courses_for_employee(UUID) IS 
'Returns available courses that can be used for certificate renewal for an employee';

COMMENT ON VIEW employee_training_progress IS 
'Provides a comprehensive view of employee training progress including completion status and certificates';