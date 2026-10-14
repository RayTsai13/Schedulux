import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import VendorRoute from './components/auth/VendorRoute';
import { FullPageSpinner } from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PublicPage from './pages/public/PublicPage';
import DropPage from './pages/public/DropPage';
import ManageBookingPage from './pages/public/ManageBookingPage';
import OnboardingPage from './pages/vendor/OnboardingPage';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';
import PageManagerPage from './pages/vendor/PageManagerPage';
import PageSettingsPage from './pages/vendor/PageSettingsPage';
import VendorAppointmentsPage from './pages/vendor/VendorAppointmentsPage';
import VendorCustomersPage from './pages/vendor/VendorCustomersPage';
import AppointmentCalendarPage from './pages/vendor/AppointmentCalendarPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsOfServicePage from './pages/legal/TermsOfServicePage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';

// The playground bundles the availability engine; load it only when visited
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Homepage - landing page, or dashboard for signed-in vendors */}
            <Route path="/" element={<HomePage />} />

            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route
              path="/playground"
              element={
                <Suspense fallback={<FullPageSpinner />}>
                  <PlaygroundPage />
                </Suspense>
              }
            />

            {/* Guest self-service from the confirmation email */}
            <Route path="/manage/:token" element={<ManageBookingPage />} />

            {/* Vendor setup (signed in, no page yet) */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Vendor dashboard (signed in, page created) */}
            <Route path="/dashboard" element={<VendorRoute><VendorDashboardPage /></VendorRoute>} />
            <Route path="/dashboard/page" element={<VendorRoute><PageManagerPage /></VendorRoute>} />
            <Route path="/dashboard/settings" element={<VendorRoute><PageSettingsPage /></VendorRoute>} />
            <Route path="/dashboard/appointments" element={<VendorRoute><VendorAppointmentsPage /></VendorRoute>} />
            <Route path="/dashboard/calendar" element={<VendorRoute><AppointmentCalendarPage /></VendorRoute>} />
            <Route path="/dashboard/customers" element={<VendorRoute><VendorCustomersPage /></VendorRoute>} />

            {/* Public booking pages: /@handle and /@handle/drops/:dropId.
                Static routes above rank first; the pages 404 for segments not starting with "@". */}
            <Route path="/:handle" element={<PublicPage />} />
            <Route path="/:handle/drops/:dropId" element={<DropPage />} />

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
