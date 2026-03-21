import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout, { editorialInputClass } from '../../components/layout/AuthLayout';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Icon helper (inline for simplicity)
// ---------------------------------------------------------------------------
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        toast.success('Login successful!');
        setTimeout(() => {
          const returnTo = searchParams.get('returnTo');
          if (returnTo) {
            navigate(returnTo);
          } else if (user?.role === 'vendor') {
            navigate('/dashboard');
          } else {
            navigate('/explore');
          }
        }, 100);
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const returnToParam = searchParams.get('returnTo');

  return (
    <AuthLayout title="Schedulux" subtitle="Welcome back to the hearth.">
      {/* Login Card */}
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-editorial" style={{ border: '1px solid rgba(191,201,195,0.10)' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
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

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-semibold font-label text-on-surface-variant">
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold text-tertiary hover:underline transition-all"
              >
                Forgot?
              </button>
            </div>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={editorialInputClass}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-error">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group shadow-primary-glow active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
              {!isLoading && (
                <Icon name="arrow_forward" className="text-lg group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-outline-variant/20" />
            <span className="flex-shrink mx-4 text-xs font-label text-outline uppercase tracking-widest">
              or continue with
            </span>
            <div className="flex-grow border-t border-outline-variant/20" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center py-3 px-4 bg-surface rounded-lg hover:bg-surface-container-low transition-colors font-label font-semibold text-sm text-on-surface-variant"
              style={{ border: '1px solid rgba(191,201,195,0.20)' }}
            >
              <Icon name="mail" className="text-lg mr-2" />
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-3 px-4 bg-surface rounded-lg hover:bg-surface-container-low transition-colors font-label font-semibold text-sm text-on-surface-variant"
              style={{ border: '1px solid rgba(191,201,195,0.20)' }}
            >
              <span
                className="material-symbols-outlined text-lg mr-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                forest
              </span>
              Schedulux ID
            </button>
          </div>
        </form>
      </div>

      {/* Bottom link */}
      <div className="mt-8 text-center">
        <p className="font-body text-sm text-on-surface-variant">
          New to the community?{' '}
          <button
            onClick={() => navigate(`/register${returnToParam ? `?returnTo=${returnToParam}` : ''}`)}
            className="font-bold text-primary hover:underline underline-offset-4"
          >
            Register your plot
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
