import React from 'react';
import { usePermissions } from '@/context/PermissionsContext';
import { PermissionGatedProps } from '@/types/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

export const PermissionGate: React.FC<PermissionGatedProps> = ({
    permissions = [],
    requireAll = false,
    fallback,
    children
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // If no permissions specified, render children
    if (permissions.length === 0) {
        return <>{children}</>;
    }

    // Check permissions
    const hasRequiredPermissions = requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);

    // If user has required permissions, render children
    if (hasRequiredPermissions) {
        return <>{children}</>;
    }

    // If fallback is provided, render it
    if (fallback) {
        return <>{fallback}</>;
    }

    // Default fallback - show access denied message
    return (
        <Alert className="border-red-200 bg-red-50">
            <Lock className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
                You don't have permission to access this feature.
                {permissions.length > 1
                    ? ` Required permissions: ${permissions.join(', ')}`
                    : ` Required permission: ${permissions[0]}`
                }
            </AlertDescription>
        </Alert>
    );
};

// Higher-order component version
export const withPermissions = <P extends object>(
    Component: React.ComponentType<P>,
    requiredPermissions: string[],
    requireAll: boolean = false
) => {
    return (props: P) => (
        <PermissionGate permissions={requiredPermissions as any} requireAll={requireAll}>
            <Component {...props} />
        </PermissionGate>
    );
}; 