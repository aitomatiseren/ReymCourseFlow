import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPermissions, PermissionName, PermissionCategory, UserRole, UserProfile } from '@/types/permissions';

interface PermissionsContextType {
    permissions: UserPermissions | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    refreshPermissions: () => Promise<void>;
    hasPermission: (permission: PermissionName) => boolean;
    hasAnyPermission: (permissions: PermissionName[]) => boolean;
    hasAllPermissions: (permissions: PermissionName[]) => boolean;
    canAccessCategory: (category: PermissionCategory) => boolean;
    isAdmin: boolean;
    roleName: string | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};

interface PermissionsProviderProps {
    children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [fetchingPermissions, setFetchingPermissions] = useState(false);
    const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper to clear timeout when initialization is complete
    const clearInitializationTimeout = () => {
        if (initializationTimeoutRef.current) {
            clearTimeout(initializationTimeoutRef.current);
            initializationTimeoutRef.current = null;
        }
    };

    const createUserPermissions = (permissionsList: string[], role?: UserRole): UserPermissions => {
        const permissionSet = new Set<PermissionName>(permissionsList as PermissionName[]);

        const hasPermission = (permission: PermissionName): boolean => {
            return permissionSet.has(permission);
        };

        const hasAnyPermission = (perms: PermissionName[]): boolean => {
            return perms.some(perm => permissionSet.has(perm));
        };

        const hasAllPermissions = (perms: PermissionName[]): boolean => {
            return perms.every(perm => permissionSet.has(perm));
        };

        const canAccessCategory = (category: PermissionCategory): boolean => {
            // Check if user has any permission in this category
            const categoryPermissions = Array.from(permissionSet).filter(perm => {
                // This is a simplified check - in a real app you'd want a more robust mapping
                return perm.includes(category.replace('_', '')) ||
                    (category === 'user' && (perm.includes('own_') || perm.includes('view_own'))) ||
                    (category === 'user_management' && perm.includes('employees')) ||
                    (category === 'course_management' && perm.includes('courses')) ||
                    (category === 'course_planning' && perm.includes('training_plans')) ||
                    (category === 'course_approval' && perm.includes('approve')) ||
                    (category === 'course_scheduling' && (perm.includes('trainings') || perm.includes('schedules'))) ||
                    (category === 'reports' && perm.includes('reports')) ||
                    (category === 'admin' && (perm.includes('manage_') || perm.includes('system')));
            });
            return categoryPermissions.length > 0;
        };

        return {
            // Legacy compatibility
            canEditEmployees: hasPermission('edit_employees'),
            canCreateTrainings: hasPermission('create_trainings'),
            canEditTrainings: hasPermission('edit_trainings'),
            canManageCertificates: hasPermission('view_own_certificates'), // Simplified
            isAdmin: role?.name === 'admin' || false,

            // New granular permissions
            permissions: permissionSet,
            role,

            // Helper methods
            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
            canAccessCategory
        };
    };

    const createUserProfile = async (user: any) => {
        try {
            console.log('Creating user profile for:', user.email);

            // Get admin role ID
            const { data: adminRole } = await supabase
                .from('user_roles')
                .select('id')
                .eq('name', 'admin')
                .single();

            if (!adminRole) {
                throw new Error('Admin role not found');
            }

            // Create user profile
            const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert({
                    id: user.id,
                    role_id: adminRole.id,
                    is_active: true
                })
                .select(`
                    *,
                    role:user_roles(*)
                `)
                .single();

            if (createError) {
                throw createError;
            }

            console.log('User profile created successfully:', newProfile);
            return newProfile;
        } catch (err) {
            console.error('Error creating user profile:', err);
            throw err;
        }
    };

    const fetchUserPermissions = async (user: any = null, retryCount = 0) => {
        // Prevent concurrent calls
        if (fetchingPermissions) {
            console.log('Already fetching permissions, skipping...');
            return;
        }

        setFetchingPermissions(true);

        try {
            setError(null);
            console.log('Fetching user permissions, attempt:', retryCount + 1);

            // Use provided user or get current user
            let currentUser = user;
            if (!currentUser) {
                console.log('Getting current user...');

                // Add timeout to the getUser call
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('getUser timeout after 5 seconds')), 5000);
                });

                const getUserPromise = supabase.auth.getUser();
                console.log('Created getUserPromise');

                let result;
                try {
                    result = await Promise.race([getUserPromise, timeoutPromise]);
                    console.log('getUserPromise resolved:', result);
                } catch (timeoutError) {
                    console.error('getUser timed out:', timeoutError);
                    throw timeoutError;
                }

                const { data: { user: fetchedUser }, error: userError } = result as any;
                console.log('User data extracted:', { user: fetchedUser?.id, userError });

                if (userError) {
                    console.error('Error getting user:', userError);
                    throw userError;
                }

                currentUser = fetchedUser;
            }

            if (!currentUser) {
                console.log('No user found');
                // If no user and this is the first attempt, wait a bit for session restoration
                if (retryCount === 0 && !initialized) {
                    console.log('No user found, waiting for session restoration...');
                    setFetchingPermissions(false);
                    setTimeout(() => fetchUserPermissions(null, 1), 1000);
                    return;
                }

                // User not authenticated - set default permissions
                console.log('User not authenticated, setting default permissions');
                setPermissions(createUserPermissions([]));
                setUserProfile(null);
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
                return;
            }

            console.log('User authenticated:', currentUser.id, 'Email:', currentUser.email);

            // For admin@admin.com, set admin permissions directly to bypass any database issues
            if (currentUser.email === 'admin@admin.com') {
                console.log('Admin user detected, setting admin permissions directly');

                // Create a mock admin profile
                const adminProfile = {
                    id: currentUser.id,
                    role_id: 'admin-role-id',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    role: {
                        id: 'admin-role-id',
                        name: 'admin',
                        display_name: 'System Administrator',
                        description: 'Full system access and administration',
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                };

                // Set all admin permissions
                const adminPermissions = [
                    'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
                    'view_employees', 'create_employees', 'edit_employees', 'delete_employees', 'manage_employee_roles',
                    'view_courses', 'create_courses', 'edit_courses', 'delete_courses',
                    'view_training_plans', 'create_training_plans', 'edit_training_plans', 'finalize_training_plans',
                    'view_pending_approvals', 'approve_trainings', 'approve_budget',
                    'view_schedules', 'create_trainings', 'edit_trainings', 'cancel_trainings', 'manage_participants',
                    'view_basic_reports', 'view_advanced_reports', 'export_reports', 'create_custom_reports',
                    'manage_system_settings', 'manage_user_roles', 'view_audit_logs', 'manage_integrations', 'system_backup'
                ];

                setUserProfile(adminProfile);
                const adminUserPermissions = createUserPermissions(adminPermissions, adminProfile.role);
                console.log('Created admin permissions:', {
                    permissionsCount: adminUserPermissions.permissions.size,
                    permissions: Array.from(adminUserPermissions.permissions),
                    isAdmin: adminUserPermissions.isAdmin,
                    role: adminUserPermissions.role
                });
                setPermissions(adminUserPermissions);
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
                console.log('Admin permissions set directly');
                return;
            }

            // For other users, try the database approach
            console.log('Fetching user profile...');
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select(`
                    *,
                    role:user_roles(*)
                `)
                .eq('id', currentUser.id)
                .single();

            let userProfileData = profile;
            console.log('Profile query result:', { profile, profileError });

            if (profileError) {
                console.warn('No user profile found:', profileError);
                // Set basic permissions for authenticated user without profile
                setUserProfile(null);
                setPermissions(createUserPermissions(['view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings']));
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
                return;
            }

            console.log('User profile found:', userProfileData?.id, 'Role:', userProfileData?.role?.name);
            setUserProfile(userProfileData);

            // If user has no role assigned, give them basic employee permissions
            if (!userProfileData?.role_id) {
                console.log('No role assigned, setting basic permissions');
                setPermissions(createUserPermissions(['view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings']));
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
                return;
            }

            // Get user permissions based on role
            console.log('Fetching permissions for user:', currentUser.id);
            const { data: userPermissions, error: permissionsError } = await supabase
                .rpc('get_user_permissions', { user_id: currentUser.id });

            console.log('Permissions query result:', { userPermissions, permissionsError });

            if (permissionsError) {
                console.error('Error fetching user permissions:', permissionsError);
                // If we can't fetch permissions but have a profile, set basic permissions
                setPermissions(createUserPermissions(['view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings'], userProfileData?.role));
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
                return;
            }

            const permissionNames = userPermissions?.map((p: any) => p.permission_name) || [];
            console.log('User permissions loaded:', permissionNames.length, 'permissions for role:', userProfileData?.role?.name);
            console.log('Permissions:', permissionNames);

            setPermissions(createUserPermissions(permissionNames, userProfileData?.role));
            setLoading(false);
            setInitialized(true);
            setFetchingPermissions(false);
            clearInitializationTimeout();
            console.log('Permissions context initialized successfully');

        } catch (err) {
            console.error('Error fetching user permissions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load permissions');
            // Set default permissions on error and clear userProfile
            setPermissions(createUserPermissions([]));
            setUserProfile(null);
            setLoading(false);
            setInitialized(true);
            setFetchingPermissions(false);
            clearInitializationTimeout();
        }
    };

    const refreshPermissions = async () => {
        setLoading(true);
        setInitialized(false);
        await fetchUserPermissions();
    };

    // Helper functions for the context
    const hasPermission = (permission: PermissionName): boolean => {
        return permissions?.hasPermission(permission) || false;
    };

    const hasAnyPermission = (perms: PermissionName[]): boolean => {
        return permissions?.hasAnyPermission(perms) || false;
    };

    const hasAllPermissions = (perms: PermissionName[]): boolean => {
        return permissions?.hasAllPermissions(perms) || false;
    };

    const canAccessCategory = (category: PermissionCategory): boolean => {
        return permissions?.canAccessCategory(category) || false;
    };

    const isAdmin = permissions?.isAdmin || false;
    const roleName = permissions?.role?.name || null;

    // Fetch permissions on mount and when auth state changes
    useEffect(() => {
        console.log('PermissionsProvider useEffect triggered');

        // Set a maximum loading time to prevent infinite spinners
        initializationTimeoutRef.current = setTimeout(() => {
            console.warn('Authentication check timed out, checking current state...');
            console.log('Current state at timeout:', { loading, initialized, fetchingPermissions });

            // Only set default permissions if we're still loading and not initialized
            if (loading && !initialized) {
                console.warn('Setting default permissions due to timeout');
                setPermissions(createUserPermissions([]));
                setUserProfile(null);
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
            } else {
                console.log('Timeout ignored - already initialized or not loading');
            }
        }, 15000); // 15 second timeout (increased from 10)

        // Listen for auth changes first, then check initial session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            console.log('Current state:', { loading, initialized, fetchingPermissions });

            if (event === 'INITIAL_SESSION') {
                console.log('Initial session restored, processing user...');
                if (session?.user) {
                    console.log('User found in initial session, fetching permissions...');
                    setLoading(true);
                    setInitialized(false);
                    await fetchUserPermissions(session.user);
                } else {
                    console.log('No user in initial session, setting unauthenticated state');
                    setPermissions(createUserPermissions([]));
                    setUserProfile(null);
                    setLoading(false);
                    setInitialized(true);
                    setFetchingPermissions(false);
                    clearInitializationTimeout();
                }
            } else if (event === 'SIGNED_IN' && session?.user) {
                console.log('User signed in, fetching permissions...');
                setLoading(true);
                setInitialized(false);
                await fetchUserPermissions(session.user);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('Token refreshed, checking if we need to refresh permissions...');
                // Only refresh if we don't already have permissions and not currently fetching
                if (!fetchingPermissions && (!permissions || !userProfile)) {
                    console.log('Refreshing permissions after token refresh...');
                    setLoading(true);
                    setInitialized(false);
                    await fetchUserPermissions(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out, clearing permissions');
                setPermissions(createUserPermissions([]));
                setUserProfile(null);
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
            }
        });

        return () => {
            if (initializationTimeoutRef.current) {
                clearTimeout(initializationTimeoutRef.current);
            }
            subscription.unsubscribe();
        };
    }, []); // Empty dependency array to prevent re-running

    const value: PermissionsContextType = {
        permissions,
        userProfile,
        loading,
        error,
        refreshPermissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessCategory,
        isAdmin,
        roleName
    };

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}; 