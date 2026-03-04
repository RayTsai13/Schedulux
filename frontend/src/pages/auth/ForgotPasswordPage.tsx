import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '../../services/api';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import UniversalCard from '../../components/universal/UniversalCard';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword(data.email);
            setIsSubmitted(true);
            toast.success('Check your email for a reset link');
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppScaffold>
            <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-v3-primary mb-2">
                            Reset password
                        </h1>
                        <p className="text-v3-secondary">
                            {isSubmitted
                                ? "We've sent you an email with a reset link."
                                : "Enter your email and we'll send you a reset link."}
                        </p>
                    </div>

                    <UniversalCard className="p-8">
                        {isSubmitted ? (
                            <div className="text-center space-y-6">
                                <div className="text-5xl">📧</div>
                                <p className="text-v3-secondary">
                                    If an account with that email exists, you'll receive a password
                                    reset link shortly. Check your spam folder if you don't see it.
                                </p>
                                <UniversalButton
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => navigate('/login')}
                                >
                                    Back to login
                                </UniversalButton>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-v3-primary mb-2"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent transition-all"
                                        placeholder="your@email.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
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
                                    {isLoading ? 'Sending...' : 'Send reset link'}
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
