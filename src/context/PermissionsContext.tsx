import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPermissions, PermissionName, PermissionCategory, UserRole, UserProfile } from '@/types/permissions';
import { wasExplicitlyLoggedOut, clearLogoutFlag } from '@/utils/sessionUtils';

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
    const lastAuthEventRef = useRef<{ event: string; timestamp: number; userId?: string } | null>(null);

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

    const fetchUserPermissions = async (user: any = null) => {
        // Check if user explicitly logged out - if so, don't fetch permissions
        if (wasExplicitlyLoggedOut()) {
            console.log('User explicitly logged out, skipping permission fetch');
            setPermissions(null);
            setUserProfile(null);
            setLoading(false);
            setInitialized(true);
            setFetchingPermissions(false);
            return;
        }

        // Prevent concurrent calls
        if (fetchingPermissions) {
            console.log('Already fetching permissions, skipping...');
            return;
        }

        setFetchingPermissions(true);
        setError(null);

        try {
            console.log('Fetching user permissions...');

            // Use provided user or get current user
            let currentUser = user;
            if (!currentUser) {
                console.log('Getting current user...');
                const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
                
                if (userError) {
                    console.error('Error getting user:', userError);
                    throw userError;
                }

                currentUser = fetchedUser;
            }

            if (!currentUser) {
                // User not authenticated - set null permissions
                console.log('User not authenticated, setting null permissions');
                setPermissions(null);
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

                // Create a mock admin profile without employee_id (system admin, not employee)
                const adminProfile = {
                    id: currentUser.id,
                    employee_id: null, // System admin is not an employee
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

            // For other users, try the database approach with timeout
            console.log('Fetching user profile...');
            let profile, profileError;
            try {
                const profilePromise = supabase
                    .from('user_profiles')
                    .select(`
                        *,
                        role:user_roles(*),
                        employee:employees(*)
                    `)
                    .eq('id', currentUser.id)
                    .single();
                
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
                );
                
                const result = await Promise.race([profilePromise, timeoutPromise]) as any;
                profile = result.data;
                profileError = result.error;
            } catch (timeoutError) {
                console.warn('User profile fetch timed out:', timeoutError);
                profileError = timeoutError;
                profile = null;
            }

            let userProfileData = profile;
            console.log('Profile query result:', { profile, profileError });

            if (profileError) {
                console.warn('No user profile found or fetch timed out:', profileError);
                
                // For any profile error, redirect to login to avoid issues
                setUserProfile(null);
                setPermissions(null);
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                clearInitializationTimeout();
                
                console.log(`User ${currentUser.email} (${currentUser.id}) profile fetch failed:`, profileError);
                console.log('User will be redirected to login page');
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
            
            let userPermissions: any[] = [];
            let permissionsError: any = null;
            
            try {
                // Add timeout to RPC call to prevent hanging
                const rpcPromise = supabase.rpc('get_user_permissions', { user_id: currentUser.id });
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('RPC timeout')), 8000)
                );
                
                const result = await Promise.race([rpcPromise, timeoutPromise]) as any;
                userPermissions = result.data;
                permissionsError = result.error;
            } catch (rpcError) {
                console.warn('RPC function get_user_permissions failed or timed out, using fallback permissions:', rpcError);
                // Fallback: Use role-based permissions if RPC function doesn't exist or times out
                if (userProfileData?.role?.name) {
                    const roleName = userProfileData.role.name;
                    console.log('Using role-based permissions for role:', roleName);
                    
                    // Define default permissions by role
                    const rolePermissions: Record<string, string[]> = {
                        'admin': [
                            'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
                            'view_employees', 'create_employees', 'edit_employees', 'delete_employees', 'manage_employee_roles',
                            'view_courses', 'create_courses', 'edit_courses', 'delete_courses',
                            'view_training_plans', 'create_training_plans', 'edit_training_plans', 'finalize_training_plans',
                            'view_pending_approvals', 'approve_trainings', 'approve_budget',
                            'view_schedules', 'create_trainings', 'edit_trainings', 'cancel_trainings', 'manage_participants',
                            'view_basic_reports', 'view_advanced_reports', 'export_reports', 'create_custom_reports',
                            'manage_system_settings', 'manage_user_roles', 'view_audit_logs', 'manage_integrations', 'system_backup'
                        ],
                        'hr': [
                            'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
                            'view_employees', 'create_employees', 'edit_employees', 'manage_employee_roles',
                            'view_courses', 'create_courses', 'edit_courses',
                            'view_training_plans', 'create_training_plans', 'edit_training_plans',
                            'view_schedules', 'create_trainings', 'edit_trainings', 'manage_participants',
                            'view_basic_reports', 'view_advanced_reports', 'export_reports'
                        ],
                        'manager': [
                            'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
                            'view_employees', 'view_courses', 'view_training_plans', 'create_training_plans',
                            'view_pending_approvals', 'approve_trainings', 'approve_budget',
                            'view_schedules', 'create_trainings', 'edit_trainings', 'manage_participants',
                            'view_basic_reports', 'export_reports'
                        ],
                        'instructor': [
                            'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings',
                            'view_employees', 'view_courses', 'view_schedules', 'edit_trainings', 'manage_participants',
                            'view_basic_reports'
                        ],
                        'employee': [
                            'view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings'
                        ]
                    };
                    
                    userPermissions = rolePermissions[roleName] || rolePermissions['employee'];
                    console.log('Using fallback permissions for role:', roleName, userPermissions);
                } else {
                    // Default employee permissions
                    userPermissions = ['view_own_profile', 'edit_own_profile', 'view_own_certificates', 'view_own_trainings'];
                }
            }

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

            // Handle both array formats (RPC result vs fallback)
            const permissionNames = Array.isArray(userPermissions) 
                ? userPermissions.map((p: any) => typeof p === 'string' ? p : p.permission_name).filter(Boolean)
                : [];
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
            
            // On any error, redirect to login to avoid infinite loading
            setError('Authentication failed - please log in again');
            setPermissions(null);
            setUserProfile(null);
            setLoading(false);
            setInitialized(true);
            setFetchingPermissions(false);
            clearInitializationTimeout();
            
            // Force clear any auth data that might be causing issues
            try {
                await supabase.auth.signOut();
            } catch (signOutError) {
                console.warn('Failed to sign out on error:', signOutError);
            }
        } finally {
            // Always reset fetchingPermissions to prevent getting stuck
            setFetchingPermissions(false);
        }
    };

    const refreshPermissions = async () => {
        // Don't refresh if explicitly logged out
        if (wasExplicitlyLoggedOut()) {
            console.log('Cannot refresh permissions - user explicitly logged out');
            return;
        }
        
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

    // Handle page visibility changes (tab switching, minimizing)
    useEffect(() => {
        let visibilityCheckTimeout: NodeJS.Timeout | null = null;
        
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('Page became visible...');
                
                // Only check if we're in a potentially stuck state
                if (!initialized && loading) {
                    console.log('Page became visible but stuck in loading, triggering faster recovery...');
                    // If we're stuck in loading state when tab becomes visible, reduce timeout
                    if (initializationTimeoutRef.current) {
                        clearTimeout(initializationTimeoutRef.current);
                        initializationTimeoutRef.current = setTimeout(() => {
                            console.warn('Fast authentication check timed out after visibility change');
                            if (!initialized) {
                                setPermissions(null);
                                setUserProfile(null);
                                setLoading(false);
                                setInitialized(true);
                                setFetchingPermissions(false);
                                setError('Authentication timeout - please refresh the page');
                            }
                        }, 5000); // Faster timeout when coming back from background
                    }
                } else if (initialized && userProfile) {
                    // Only do a lightweight check, and debounce it to avoid repeated calls
                    if (visibilityCheckTimeout) {
                        clearTimeout(visibilityCheckTimeout);
                    }
                    
                    visibilityCheckTimeout = setTimeout(() => {
                        console.log('Doing lightweight auth check after visibility change...');
                        supabase.auth.getUser().then(({ data: { user }, error }) => {
                            if (error) {
                                console.warn('Auth check failed on visibility change:', error);
                                return;
                            }
                            
                            if (!user && userProfile) {
                                console.log('User session lost while tab was in background, clearing state');
                                setPermissions(null);
                                setUserProfile(null);
                            }
                        });
                    }, 1000); // Debounce visibility checks
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (visibilityCheckTimeout) {
                clearTimeout(visibilityCheckTimeout);
            }
        };
    }, [initialized, userProfile, loading]);

    // Fetch permissions on mount and when auth state changes
    useEffect(() => {
        console.log('PermissionsProvider useEffect triggered');

        // Set a maximum loading time to prevent infinite spinners  
        initializationTimeoutRef.current = setTimeout(() => {
            console.warn('Authentication check timed out after 12 seconds');
            // Set unauthenticated state on timeout
            if (!initialized) {
                setPermissions(null);
                setUserProfile(null);
                setLoading(false);
                setInitialized(true);
                setFetchingPermissions(false);
                setError('Authentication timeout - please refresh the page');
            }
        }, 12000); // 12 second timeout

        // Listen for auth changes first, then check initial session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            console.log('Current state:', { loading, initialized, fetchingPermissions });

            if (event === 'INITIAL_SESSION') {
                console.log('=== INITIAL_SESSION event ===');
                console.log('Session user:', session?.user?.id, session?.user?.email);
                console.log('Was explicitly logged out:', wasExplicitlyLoggedOut());
                
                // Check if we were explicitly logged out
                if (wasExplicitlyLoggedOut()) {
                    console.log('User explicitly logged out, ignoring session and staying unauthenticated');
                    setPermissions(null);
                    setUserProfile(null);
                    setLoading(false);
                    setInitialized(true);
                    clearInitializationTimeout();
                    return;
                }
                
                if (session?.user) {
                    console.log('User found in initial session, fetching permissions...');
                    setLoading(true);
                    try {
                        await fetchUserPermissions(session.user);
                        console.log('=== Initial session permission fetch completed ===');
                    } catch (error) {
                        console.error('=== Initial session permission fetch failed ===', error);
                    }
                } else {
                    console.log('No user in initial session, setting unauthenticated state');
                    setPermissions(null);
                    setUserProfile(null);
                    setLoading(false);
                    setInitialized(true);
                    clearInitializationTimeout();
                }
            } else if (event === 'SIGNED_IN' && session?.user) {
                console.log('=== SIGNED_IN event ===');
                console.log('User signed in');
                
                // Check if this is a duplicate event (debouncing)
                const now = Date.now();
                const lastEvent = lastAuthEventRef.current;
                if (lastEvent && 
                    lastEvent.event === 'SIGNED_IN' && 
                    lastEvent.userId === session.user.id && 
                    now - lastEvent.timestamp < 3000) { // 3 second debounce
                    console.log('Ignoring duplicate SIGNED_IN event within 3 seconds');
                    return;
                }
                
                lastAuthEventRef.current = { event: 'SIGNED_IN', timestamp: now, userId: session.user.id };
                
                clearLogoutFlag(); // Clear flag on successful sign in
                
                // Set loading state but don't fetch immediately - let INITIAL_SESSION handle it
                // This avoids the race condition where SIGNED_IN times out but INITIAL_SESSION succeeds
                setLoading(true);
                setInitialized(false);
                
                console.log('SIGNED_IN: Setting loading state, waiting for INITIAL_SESSION to handle permission fetch');
                
                // Set a short timeout to fetch permissions if INITIAL_SESSION doesn't fire
                setTimeout(async () => {
                    if (!initialized && loading) {
                        console.log('INITIAL_SESSION did not fire, fetching permissions from SIGNED_IN');
                        try {
                            await fetchUserPermissions(session.user);
                            console.log('=== SIGNED_IN permission fetch completed ===');
                        } catch (error) {
                            console.error('=== SIGNED_IN permission fetch failed ===', error);
                        }
                    }
                }, 2000); // Wait 2 seconds for INITIAL_SESSION
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                setPermissions(null);
                setUserProfile(null);
                setLoading(false);
                setInitialized(true);
                clearInitializationTimeout();
            }
            // Remove TOKEN_REFRESHED handler to prevent auto-login issues
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