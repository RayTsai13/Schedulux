import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VendorProfilePage from './pages/VendorProfilePage';
import ExplorePage from './pages/ExplorePage';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';
import StorefrontDetailPage from './pages/vendor/StorefrontDetailPage';
import AppointmentCalendarPage from './pages/vendor/AppointmentCalendarPage';
import ClientAppointmentsPage from './pages/client/ClientAppointmentsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Homepage - Smart redirect based on auth */}
            <Route path="/" element={<HomePage />} />

            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/book/:storefrontId" element={<VendorProfilePage />} />

            {/* Protected Vendor Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireRole="vendor">
                  <VendorDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/storefront/:id"
              element={
                <ProtectedRoute requireRole="vendor">
                  <StorefrontDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/storefront/:id/calendar"
              element={
                <ProtectedRoute requireRole="vendor">
                  <AppointmentCalendarPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Client Routes */}
            <Route
              path="/my-appointments"
              element={
                <ProtectedRoute>
                  <ClientAppointmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-all — must be the last route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
