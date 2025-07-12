import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const createLoginSchema = (t: any) => z.object({
    email: z.string().email(t('auth:login.emailInvalid')),
    password: z.string().min(6, t('auth:login.passwordMinLength')),
});

type LoginFormData = {
    email: string;
    password: string;
};

interface LoginFormProps {
    onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
    const { t } = useTranslation(['auth', 'common']);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const loginSchema = createLoginSchema(t);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        setLoginSuccess(false);

        try {
            console.log('Attempting login with:', data.email);

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) {
                console.error('Login error:', authError);
                throw authError;
            }

            if (authData.user) {
                console.log('Login successful for user:', authData.user.id);
                setLoginSuccess(true);
                toast.success(t('auth:login.loginSuccessMessage'));

                // Wait a bit longer for the auth state to propagate
                setTimeout(() => {
                    onSuccess?.();
                }, 1000);
            } else {
                throw new Error('No user returned from login');
            }
        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
            setError(errorMessage);
            toast.error(t('auth:login.loginError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">{t('auth:login.welcomeBack')}</CardTitle>
                <CardDescription className="text-center">
                    {t('auth:login.signInToContinue')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loginSuccess && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {t('auth:login.loginSuccessMessage')}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">{t('auth:login.email')}</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder={t('auth:login.emailPlaceholder')}
                                className="pl-10"
                                {...register('email')}
                                disabled={isLoading || loginSuccess}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">{t('auth:login.password')}</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('auth:login.passwordPlaceholder')}
                                className="pl-10 pr-10"
                                {...register('password')}
                                disabled={isLoading || loginSuccess}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                disabled={isLoading || loginSuccess}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || loginSuccess}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('auth:login.signingIn')}
                            </>
                        ) : loginSuccess ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('auth:login.loadingDashboard')}
                            </>
                        ) : (
                            t('auth:login.signIn')
                        )}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        {t('auth:login.demoText')}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}; 