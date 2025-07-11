import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { usePermissions } from '@/context/PermissionsContext';

export default function Login() {
    const navigate = useNavigate();
    const { permissions, userProfile, loading } = usePermissions();
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);

    // If user is already logged in, redirect to dashboard
    useEffect(() => {
        if (!loading && !hasCheckedAuth) {
            setHasCheckedAuth(true);

            // Check if user is authenticated (has userProfile or permissions)
            const isAuthenticated = userProfile || (permissions && permissions.permissions.size > 0);

            if (isAuthenticated) {
                console.log('User already authenticated, redirecting to dashboard');
                console.log('Auth state:', {
                    hasUserProfile: !!userProfile,
                    hasPermissions: !!permissions,
                    permissionsCount: permissions?.permissions?.size || 0,
                    isAdmin: permissions?.isAdmin || false
                });
                navigate('/', { replace: true });
            }
        }
    }, [permissions, userProfile, loading, navigate, hasCheckedAuth]);

    const handleLoginSuccess = () => {
        console.log('Login successful, setting up redirect...');

        // Clear any existing timer
        if (redirectTimer) {
            clearTimeout(redirectTimer);
        }

        // Set up redirect with a reasonable delay to allow permissions to load
        const timer = setTimeout(() => {
            console.log('Redirecting to dashboard...');
            navigate('/', { replace: true });
        }, 1500); // Increased delay to allow permissions to load

        setRedirectTimer(timer);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (redirectTimer) {
                clearTimeout(redirectTimer);
            }
        };
    }, [redirectTimer]);

    // Show loading while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <img
                        src="/lovable-uploads/ac9dfd50-16e3-40fc-bd96-7722cc5e2bb9.png"
                        alt="Company Logo"
                        className="mx-auto h-12 w-12 mb-4"
                    />
                    <h2 className="text-3xl font-bold text-gray-900">
                        Training Management System
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage your training programs and certifications
                    </p>
                </div>

                <LoginForm onSuccess={handleLoginSuccess} />
            </div>
        </div>
    );
} 