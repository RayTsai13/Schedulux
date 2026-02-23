import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-v3-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-v3-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-v3-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect based on authentication and role
  if (!isAuthenticated) {
    return <Navigate to="/explore" replace />;
  }

  if (user?.role === 'vendor') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/explore" replace />;
}
