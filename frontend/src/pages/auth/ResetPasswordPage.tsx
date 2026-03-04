import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '../../services/api';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import UniversalCard from '../../components/universal/UniversalCard';

const resetPasswordSchema = z
    .object({
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) return;

        setIsLoading(true);
        try {
            const result = await authApi.resetPassword(token, data.password);
            if (result.success) {
                setIsSuccess(true);
                toast.success('Password reset successfully!');
            } else {
                toast.error(result.message || 'Failed to reset password');
            }
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // No token in URL
    if (!token) {
        return (
            <AppScaffold>
                <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
                    <div className="w-full max-w-md text-center">
                        <UniversalCard className="p-8">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-bold text-v3-primary mb-4">
                                Invalid Reset Link
                            </h1>
                            <p className="text-v3-secondary mb-6">
                                This password reset link is missing or invalid. Please request a new one.
                            </p>
                            <UniversalButton
                                variant="primary"
                                size="lg"
                                className="w-full"
                                onClick={() => navigate('/forgot-password')}
                            >
                                Request new link
                            </UniversalButton>
                        </UniversalCard>
                    </div>
                </div>
            </AppScaffold>
        );
    }

    return (
        <AppScaffold>
            <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-v3-primary mb-2">
                            {isSuccess ? 'Password reset!' : 'Set new password'}
                        </h1>
                        <p className="text-v3-secondary">
                            {isSuccess
                                ? 'Your password has been updated successfully.'
                                : 'Choose a strong password for your account.'}
                        </p>
                    </div>

                    <UniversalCard className="p-8">
                        {isSuccess ? (
                            <div className="text-center space-y-6">
                                <div className="text-5xl">✅</div>
                                <p className="text-v3-secondary">
                                    You can now log in with your new password.
                                </p>
                                <UniversalButton
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => navigate('/login')}
                                >
                                    Go to login
                                </UniversalButton>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-v3-primary mb-2"
                                    >
                                        New Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        {...register('password')}
                                        className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent transition-all"
                                        placeholder="Enter new password"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium text-v3-primary mb-2"
                                    >
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        {...register('confirmPassword')}
                                        className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent transition-all"
                                        placeholder="Confirm new password"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <UniversalButton
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Resetting...' : 'Reset password'}
                                </UniversalButton>
                            </form>
                        )}
                    </UniversalCard>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-v3-accent hover:text-v3-accent/80 font-medium transition-colors"
                        >
                            ← Back to login
                        </button>
                    </div>
                </div>
            </div>
        </AppScaffold>
    );
}
