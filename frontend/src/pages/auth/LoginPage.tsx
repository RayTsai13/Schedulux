import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import UniversalCard from '../../components/universal/UniversalCard';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
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

        // Redirect based on user role after login completes
        // Need to wait a tick for user state to update
        setTimeout(() => {
          const currentUser = user;
          if (currentUser?.role === 'vendor') {
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

  return (
    <AppScaffold>
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-v3-primary mb-2">
              Welcome back
            </h1>
            <p className="text-v3-secondary">
              Sign in to your Schedulux account
            </p>
          </div>

          {/* Login Form Card */}
          <UniversalCard className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
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

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-v3-primary mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <UniversalButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </UniversalButton>
            </form>

            {/* Demo Credentials Hint */}
            <div className="mt-6 p-4 bg-v3-background rounded-xl border border-v3-border">
              <p className="text-sm text-v3-secondary mb-3 font-medium">
                Demo Accounts:
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-v3-primary mb-1.5">Vendors:</p>
                  <div className="space-y-1 text-xs text-v3-secondary">
                    <p><span className="text-v3-primary font-mono">midnight@schedulux.dev / Hero123!</span></p>
                    <p><span className="text-v3-primary font-mono">fixit@schedulux.dev / Hero123!</span></p>
                    <p><span className="text-v3-primary font-mono">flash@schedulux.dev / Hero123!</span></p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-v3-primary mb-1.5">Clients:</p>
                  <div className="space-y-1 text-xs text-v3-secondary">
                    <p><span className="text-v3-primary font-mono">client1@schedulux.dev / Client123!</span></p>
                    <p><span className="text-v3-primary font-mono">client2@schedulux.dev / Client123!</span></p>
                  </div>
                </div>
                <p className="text-xs text-v3-secondary/70 italic pt-2 border-t border-v3-border">
                  Run <code className="px-1.5 py-0.5 bg-v3-surface rounded font-mono">npm run seed:clients</code> in backend to create client accounts
                </p>
              </div>
            </div>
          </UniversalCard>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-v3-secondary">
              Don't have an account?{' '}
              <button
                onClick={() => toast.info('Signup coming soon! Use demo accounts for now.')}
                className="text-v3-accent hover:text-v3-accent/80 font-medium transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </AppScaffold>
  );
}
