import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '../../services/api';
import AuthLayout from '../../components/layout/AuthLayout';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

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
      <AuthLayout>
        <div className="bg-surface-container-lowest rounded-xl p-10 max-w-md mx-auto text-center" style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error-container flex items-center justify-center">
            <Icon name="link_off" className="text-3xl text-on-error-container" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-primary mb-2">Invalid Reset Link</h1>
          <p className="text-on-surface-variant mb-8">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-primary text-on-primary py-3 rounded-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            Request New Link
            <Icon name="arrow_forward" className="text-lg" />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="bg-surface-container-lowest rounded-xl p-10 max-w-md mx-auto" style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}>
        {isSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary-container flex items-center justify-center">
              <Icon name="check_circle" fill className="text-3xl text-primary" />
            </div>
            <h1 className="text-2xl font-headline font-bold text-primary mb-2">Password Reset!</h1>
            <p className="text-on-surface-variant mb-8">Your password has been updated. You can now log in.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-on-primary py-3 rounded-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2"
            >
              Go to Login
              <Icon name="arrow_forward" className="text-lg" />
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface-container-low flex items-center justify-center">
                <Icon name="lock_reset" className="text-3xl text-primary" />
              </div>
              <h1 className="text-2xl font-headline font-bold text-primary mb-2">Set New Password</h1>
              <p className="text-on-surface-variant">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-label font-semibold text-on-surface-variant uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-primary transition-all py-3 px-0 font-body text-on-surface placeholder:text-outline-variant"
                  placeholder="Enter new password"
                />
                {errors.password && (
                  <p className="text-sm text-error">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-label font-semibold text-on-surface-variant uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-primary transition-all py-3 px-0 font-body text-on-surface placeholder:text-outline-variant"
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    Reset Password
                    <Icon name="arrow_forward" className="text-lg" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-on-surface-variant hover:text-primary font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <Icon name="arrow_back" className="text-sm" />
            Back to Login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
