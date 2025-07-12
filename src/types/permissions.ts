// User Roles and Permissions Types
import { Employee } from './index';

export interface UserRole {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    category: PermissionCategory;
    is_active: boolean;
    created_at: string;
}

export interface RolePermission {
    id: string;
    role_id: string;
    permission_id: string;
    created_at: string;
}

export interface UserProfile {
    id: string;
    employee_id?: string;
    role_id?: string;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
    // Relations
    role?: UserRole;
    employee?: Employee;
}

export type PermissionCategory =
    | 'user'
    | 'user_management'
    | 'course_management'
    | 'course_planning'
    | 'course_approval'
    | 'course_scheduling'
    | 'reports'
    | 'admin';

export type PermissionName =
    // User permissions
    | 'view_own_profile'
    | 'edit_own_profile'
    | 'view_own_certificates'
    | 'view_own_trainings'
    // User Management permissions
    | 'view_employees'
    | 'create_employees'
    | 'edit_employees'
    | 'delete_employees'
    | 'manage_employee_roles'
    // Course Management permissions
    | 'view_courses'
    | 'create_courses'
    | 'edit_courses'
    | 'delete_courses'
    // Course Planning permissions
    | 'view_training_plans'
    | 'create_training_plans'
    | 'edit_training_plans'
    | 'finalize_training_plans'
    // Course Approval permissions
    | 'view_pending_approvals'
    | 'approve_trainings'
    | 'approve_budget'
    // Course Scheduling permissions
    | 'view_schedules'
    | 'create_trainings'
    | 'edit_trainings'
    | 'cancel_trainings'
    | 'manage_participants'
    // Reports permissions
    | 'view_basic_reports'
    | 'view_advanced_reports'
    | 'export_reports'
    | 'create_custom_reports'
    // Admin permissions
    | 'manage_system_settings'
    | 'manage_user_roles'
    | 'view_audit_logs'
    | 'manage_integrations'
    | 'system_backup';

export type RoleName = 'employee' | 'instructor' | 'manager' | 'hr' | 'admin';

export interface UserPermissions {
    // Legacy compatibility
    canEditEmployees: boolean;
    canCreateTrainings: boolean;
    canEditTrainings: boolean;
    canManageCertificates: boolean;
    isAdmin: boolean;

    // New granular permissions
    permissions: Set<PermissionName>;
    role?: UserRole;

    // Helper methods
    hasPermission: (permission: PermissionName) => boolean;
    hasAnyPermission: (permissions: PermissionName[]) => boolean;
    hasAllPermissions: (permissions: PermissionName[]) => boolean;
    canAccessCategory: (category: PermissionCategory) => boolean;
}

export interface PermissionCheck {
    permission: PermissionName;
    required: boolean;
    message?: string;
}

// Utility types for components
export interface PermissionGatedProps {
    permissions?: PermissionName[];
    requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission is sufficient
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

// Role-based feature access mapping (flat structure - no hierarchy)
export const ROLE_FEATURES: Record<RoleName, {
    navigation: string[];
    features: PermissionCategory[];
}> = {
    employee: {
        navigation: ['dashboard', 'employee-dashboard'],
        features: ['user']
    },
    instructor: {
        navigation: ['dashboard', 'scheduling', 'employee-dashboard'],
        features: ['user', 'course_scheduling']
    },
    manager: {
        navigation: ['dashboard', 'participants', 'scheduling', 'reports', 'employee-dashboard'],
        features: ['user', 'course_planning', 'course_approval', 'course_scheduling', 'reports']
    },
    hr: {
        navigation: ['dashboard', 'courses', 'participants', 'scheduling', 'reports', 'certifications'],
        features: ['user', 'user_management', 'course_management', 'course_planning', 'course_approval', 'course_scheduling', 'reports']
    },
    admin: {
        navigation: ['dashboard', 'courses', 'participants', 'scheduling', 'reports', 'certifications', 'settings'],
        features: ['user', 'user_management', 'course_management', 'course_planning', 'course_approval', 'course_scheduling', 'reports', 'admin']
    }
};

// Permission categories and their descriptions
export const PERMISSION_CATEGORIES: Record<PermissionCategory, {
    name: string;
    description: string;
    icon: string;
}> = {
    user: {
        name: 'Own User Info',
        description: 'Access to own profile, certificates, and training history',
        icon: 'User'
    },
    user_management: {
        name: 'User Management',
        description: 'Manage employee records and user accounts',
        icon: 'Users'
    },
    course_management: {
        name: 'Course Management',
        description: 'Create and manage training courses',
        icon: 'BookOpen'
    },
    course_planning: {
        name: 'Course Planning',
        description: 'Plan and schedule training programs',
        icon: 'Calendar'
    },
    course_approval: {
        name: 'Course Approval',
        description: 'Approve training requests and budgets',
        icon: 'CheckCircle'
    },
    course_scheduling: {
        name: 'Course Scheduling',
        description: 'Schedule training sessions and manage participants',
        icon: 'Clock'
    },
    reports: {
        name: 'Reports Management',
        description: 'View and generate training and compliance reports',
        icon: 'BarChart'
    },
    admin: {
        name: 'Admin Management',
        description: 'System administration and configuration',
        icon: 'Settings'
    }
}; 