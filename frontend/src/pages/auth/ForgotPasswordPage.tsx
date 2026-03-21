import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '../../services/api';
import AuthLayout, { editorialInputClass } from '../../components/layout/AuthLayout';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

// ---------------------------------------------------------------------------
// ForgotPasswordPage
// ---------------------------------------------------------------------------
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
    <AuthLayout
      title="Schedulux"
      subtitle={isSubmitted ? "We've sent you an email with a reset link." : "Enter your email and we'll send you a reset link."}
      icon="lock_reset"
    >
      {/* Card */}
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-editorial" style={{ border: '1px solid rgba(191,201,195,0.10)' }}>
        {isSubmitted ? (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-fixed mb-2">
              <Icon name="mark_email_read" className="text-3xl text-primary" />
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              If an account with that email exists, you'll receive a password
              reset link shortly. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group shadow-primary-glow active:scale-[0.98]"
            >
              Back to login
              <Icon name="arrow_forward" className="text-lg group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold font-label text-on-surface-variant mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={editorialInputClass}
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group shadow-primary-glow active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? 'Sending…' : 'Send reset link'}
              {!isLoading && (
                <Icon name="arrow_forward" className="text-lg group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>
        )}
      </div>

      {/* Bottom link */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/login')}
          className="font-body text-sm text-primary hover:underline underline-offset-4 font-bold flex items-center gap-1 mx-auto"
        >
          <Icon name="arrow_back" className="text-base" />
          Back to login
        </button>
      </div>
    </AuthLayout>
  );
}
