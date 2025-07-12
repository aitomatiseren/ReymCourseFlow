import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/context/PermissionsContext';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { permissions, loading, userProfile, error } = usePermissions();
    const location = useLocation();

    // Debug logging
    console.log('AuthGuard state:', {
        loading,
        hasUserProfile: !!userProfile,
        hasPermissions: !!permissions,
        permissionsCount: permissions?.permissions?.size || 0,
        isAdmin: permissions?.isAdmin || false,
        roleName: permissions?.role?.name || null,
        error,
        pathname: location.pathname,
        userProfileId: userProfile?.id,
        permissionsArray: permissions?.permissions ? Array.from(permissions.permissions) : []
    });

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading application...</p>
                    <p className="text-sm text-gray-500 mt-2">
                        {document.hidden || document.visibilityState === 'hidden' 
                            ? 'Reconnecting after background...' 
                            : 'Checking authentication status'}
                    </p>
                </div>
            </div>
        );
    }

    // Show error state if there's an authentication error
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-900 font-medium">Authentication Error</p>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Check if user is authenticated
    // A user is authenticated if they have a userProfile OR permissions
    const isAuthenticated = !!(userProfile || permissions);

    console.log('AuthGuard authentication check:', {
        isAuthenticated,
        hasUserProfile: !!userProfile,
        hasPermissions: !!permissions,
        error
    });

    if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        // Clear any stale auth data
        localStorage.removeItem('explicit_logout');
        // Redirect to login page, but remember where they were trying to go
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log('User authenticated, rendering protected content');
    // User is authenticated, render the protected content
    return <>{children}</>;
}; 