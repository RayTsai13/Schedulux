import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout, { editorialInputClass } from '../../components/layout/AuthLayout';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client', 'vendor']),
});

type RegisterFormData = z.infer<typeof registerSchema>;

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

// ---------------------------------------------------------------------------
// RegisterPage
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'client' },
  });

  const selectedRole = watch('role');

  // Redirect already-authenticated users
  if (isAuthenticated && user) {
    const returnTo = searchParams.get('returnTo');
    navigate(returnTo || (user.role === 'vendor' ? '/dashboard' : '/explore'), { replace: true });
    return null;
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await registerUser(data);
      if (result.success) {
        toast.success('Account created! Welcome to Schedulux.');
        const returnTo = searchParams.get('returnTo');
        navigate(returnTo || (data.role === 'vendor' ? '/dashboard' : '/explore'));
      } else {
        setServerError(result.error || 'Registration failed');
      }
    } catch {
      setServerError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const returnToParam = searchParams.get('returnTo');
  const loginHref = returnToParam ? `/login?returnTo=${returnToParam}` : '/login';

  return (
    <AuthLayout title="Schedulux" subtitle="Plant your roots in our community." icon="eco">
      {/* Register Card */}
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-editorial" style={{ border: '1px solid rgba(191,201,195,0.10)' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-semibold font-label text-on-surface-variant mb-2">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                {...register('first_name')}
                className={editorialInputClass}
                placeholder="Jane"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-error">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-semibold font-label text-on-surface-variant mb-2">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                {...register('last_name')}
                className={editorialInputClass}
                placeholder="Smith"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-error">{errors.last_name.message}</p>
              )}
            </div>
          </div>

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
            <label htmlFor="password" className="block text-sm font-semibold font-label text-on-surface-variant mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={editorialInputClass}
              placeholder="At least 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-error">{errors.password.message}</p>
            )}
          </div>

          {/* Role selection — editorial chips */}
          <div>
            <p className="block text-sm font-semibold font-label text-on-surface-variant mb-3">
              I am joining as…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['client', 'vendor'] as const).map((r) => {
                const isActive = selectedRole === r;
                return (
                  <label
                    key={r}
                    className={`
                      flex items-center gap-3 px-4 py-3.5 rounded-lg cursor-pointer transition-all
                      ${isActive
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'
                      }
                    `}
                    style={!isActive ? { border: '1px solid rgba(191,201,195,0.20)' } : undefined}
                  >
                    <input type="radio" value={r} {...register('role')} className="sr-only" />
                    <Icon
                      name={r === 'client' ? 'person' : 'storefront'}
                      fill={isActive}
                      className="text-xl"
                    />
                    <span className="text-sm font-semibold capitalize">{r}</span>
                  </label>
                );
              })}
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-error">{errors.role.message}</p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-error-container text-on-error-container text-sm">
              <Icon name="error" className="text-lg mt-0.5 flex-shrink-0" />
              {serverError}
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group shadow-primary-glow active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
              {!isLoading && (
                <Icon name="arrow_forward" className="text-lg group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom link */}
      <div className="mt-8 text-center">
        <p className="font-body text-sm text-on-surface-variant">
          Already part of the community?{' '}
          <Link to={loginHref} className="font-bold text-primary hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
