-- Create User Roles and Permissions System
-- Migration: 20250113_create_user_roles_system.sql

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permissions table
CREATE TABLE public.permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g., 'user', 'course', 'training', 'report', 'admin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions mapping table
CREATE TABLE public.role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- Add role_id to employees table
ALTER TABLE public.employees 
ADD COLUMN role_id UUID REFERENCES public.user_roles(id) DEFAULT NULL;

-- Create user_profiles table for Supabase auth users
CREATE TABLE public.user_profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.user_roles(id) DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default roles (flat structure, no hierarchy)
INSERT INTO public.user_roles (name, display_name, description) VALUES
('employee', 'Employee', 'Basic employee with access to own information only'),
('instructor', 'Instructor', 'Can manage assigned training sessions'),
('manager', 'Manager', 'Can manage team members and approve trainings'),
('hr', 'HR Manager', 'Can manage all employees and company-wide training'),
('admin', 'System Administrator', 'Full system access and administration');

-- Insert permissions
INSERT INTO public.permissions (name, display_name, description, category) VALUES
-- User/Employee permissions
('view_own_profile', 'View Own Profile', 'View own employee information', 'user'),
('edit_own_profile', 'Edit Own Profile', 'Edit own employee information', 'user'),
('view_own_certificates', 'View Own Certificates', 'View own certificates and licenses', 'user'),
('view_own_trainings', 'View Own Trainings', 'View own training history and upcoming trainings', 'user'),

-- User Management permissions
('view_employees', 'View Employees', 'View employee list and profiles', 'user_management'),
('create_employees', 'Create Employees', 'Add new employees to the system', 'user_management'),
('edit_employees', 'Edit Employees', 'Edit employee information', 'user_management'),
('delete_employees', 'Delete Employees', 'Remove employees from the system', 'user_management'),
('manage_employee_roles', 'Manage Employee Roles', 'Assign and modify employee roles', 'user_management'),

-- Course Management permissions
('view_courses', 'View Courses', 'View course catalog', 'course_management'),
('create_courses', 'Create Courses', 'Create new training courses', 'course_management'),
('edit_courses', 'Edit Courses', 'Modify existing courses', 'course_management'),
('delete_courses', 'Delete Courses', 'Remove courses from the system', 'course_management'),

-- Course Planning permissions
('view_training_plans', 'View Training Plans', 'View training plans and schedules', 'course_planning'),
('create_training_plans', 'Create Training Plans', 'Create preliminary training plans', 'course_planning'),
('edit_training_plans', 'Edit Training Plans', 'Modify training plans', 'course_planning'),
('finalize_training_plans', 'Finalize Training Plans', 'Convert preliminary plans to confirmed schedules', 'course_planning'),

-- Course Approval permissions
('view_pending_approvals', 'View Pending Approvals', 'View trainings requiring approval', 'course_approval'),
('approve_trainings', 'Approve Trainings', 'Approve or reject training requests', 'course_approval'),
('approve_budget', 'Approve Budget', 'Approve training budgets and costs', 'course_approval'),

-- Course Scheduling permissions
('view_schedules', 'View Schedules', 'View training schedules and calendar', 'course_scheduling'),
('create_trainings', 'Create Trainings', 'Schedule new training sessions', 'course_scheduling'),
('edit_trainings', 'Edit Trainings', 'Modify training sessions', 'course_scheduling'),
('cancel_trainings', 'Cancel Trainings', 'Cancel training sessions', 'course_scheduling'),
('manage_participants', 'Manage Participants', 'Add/remove training participants', 'course_scheduling'),

-- Reports Management permissions
('view_basic_reports', 'View Basic Reports', 'View basic training and compliance reports', 'reports'),
('view_advanced_reports', 'View Advanced Reports', 'View detailed analytics and reports', 'reports'),
('export_reports', 'Export Reports', 'Export reports to Excel/PDF', 'reports'),
('create_custom_reports', 'Create Custom Reports', 'Create custom report templates', 'reports'),

-- Admin Management permissions
('manage_system_settings', 'Manage System Settings', 'Configure system-wide settings', 'admin'),
('manage_user_roles', 'Manage User Roles', 'Create and modify user roles', 'admin'),
('view_audit_logs', 'View Audit Logs', 'View system audit logs', 'admin'),
('manage_integrations', 'Manage Integrations', 'Configure external integrations', 'admin'),
('system_backup', 'System Backup', 'Perform system backups', 'admin');

-- Assign permissions to roles (explicit, non-hierarchical)
-- Employee role - only own information
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.user_roles r, public.permissions p
WHERE r.name = 'employee' AND p.name IN (
    'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings'
);

-- Instructor role - own info + training session management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.user_roles r, public.permissions p
WHERE r.name = 'instructor' AND p.name IN (
    'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
    'view_schedules', 'edit_trainings', 'manage_participants'
);

-- Manager role - team management + approvals + basic reports
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.user_roles r, public.permissions p
WHERE r.name = 'manager' AND p.name IN (
    'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
    'view_employees', 'view_courses', 'view_training_plans', 'create_training_plans', 'edit_training_plans',
    'view_pending_approvals', 'approve_trainings', 'view_schedules', 'create_trainings', 'edit_trainings',
    'manage_participants', 'view_basic_reports', 'export_reports'
);

-- HR role - comprehensive employee and training management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.user_roles r, public.permissions p
WHERE r.name = 'hr' AND p.name IN (
    'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
    'view_employees', 'create_employees', 'edit_employees', 'delete_employees',
    'view_courses', 'create_courses', 'edit_courses', 'delete_courses',
    'view_training_plans', 'create_training_plans', 'edit_training_plans', 'finalize_training_plans',
    'view_pending_approvals', 'approve_trainings', 'approve_budget',
    'view_schedules', 'create_trainings', 'edit_trainings', 'cancel_trainings', 'manage_participants',
    'view_basic_reports', 'view_advanced_reports', 'export_reports', 'create_custom_reports'
);

-- Admin role - full system access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.user_roles r, public.permissions p
WHERE r.name = 'admin';

-- Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read roles and permissions (for UI)
CREATE POLICY "Allow authenticated users to read user_roles" ON public.user_roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read permissions" ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read role_permissions" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Admin users can manage all user profiles
CREATE POLICY "Admins can manage all user profiles" ON public.user_profiles
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.id = auth.uid() AND ur.name = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX idx_user_profiles_employee_id ON public.user_profiles(employee_id);
CREATE INDEX idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX idx_employees_role_id ON public.employees(role_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_permissions_category ON public.permissions(category);

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE(permission_name TEXT, permission_category TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.name, p.category
    FROM public.user_profiles up
    JOIN public.user_roles ur ON up.role_id = ur.id
    JOIN public.role_permissions rp ON ur.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE up.id = user_id AND up.is_active = true AND ur.is_active = true AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM get_user_permissions(user_id) 
        WHERE permission_name = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 