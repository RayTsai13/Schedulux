import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen w-full bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-on-surface-variant">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Only signed-in vendors get past this; everyone else goes to /login.
 * (Guests never sign in — they manage bookings from their emailed link.)
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated || user?.role !== 'vendor') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
