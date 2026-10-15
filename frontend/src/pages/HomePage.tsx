import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FullPageSpinner } from '../components/auth/ProtectedRoute';
import LandingPage from './LandingPage';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  // Signed-in vendors go straight to their dashboard; everyone else sees the landing page
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}
