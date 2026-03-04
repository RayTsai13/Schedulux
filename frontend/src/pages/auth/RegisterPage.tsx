import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import UniversalCard from '../../components/universal/UniversalCard';

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client', 'vendor']),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'client' },
  });

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

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent transition-all';

  return (
    <AppScaffold>
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-v3-primary mb-2">Create account</h1>
            <p className="text-v3-secondary">Join Schedulux today</p>
          </div>

          <UniversalCard className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-v3-primary mb-2">
                    First name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    {...register('first_name')}
                    className={inputClass}
                    placeholder="Jane"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-v3-primary mb-2">
                    Last name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    {...register('last_name')}
                    className={inputClass}
                    placeholder="Smith"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-v3-primary mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={inputClass}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-v3-primary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={inputClass}
                  placeholder="At least 8 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <p className="block text-sm font-medium text-v3-primary mb-3">I am a…</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['client', 'vendor'] as const).map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-v3-border bg-v3-background cursor-pointer hover:border-v3-accent transition-colors has-[:checked]:border-v3-accent has-[:checked]:bg-v3-accent/5"
                    >
                      <input type="radio" value={r} {...register('role')} className="accent-v3-accent" />
                      <span className="text-sm font-medium text-v3-primary capitalize">{r}</span>
                    </label>
                  ))}
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {serverError}
                </p>
              )}

              <UniversalButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account…' : 'Create account'}
              </UniversalButton>
            </form>
          </UniversalCard>

          <div className="mt-6 text-center">
            <p className="text-sm text-v3-secondary">
              Already have an account?{' '}
              <Link to={loginHref} className="text-v3-accent hover:text-v3-accent/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AppScaffold>
  );
}
