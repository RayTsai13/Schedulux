// ================================================================
// REACT ROUTER AND COMPONENT IMPORTS
// ================================================================ 

// React Router imports for client-side navigation
// BrowserRouter: Enables HTML5 history API routing (clean URLs without #)
// Routes: Container for all route definitions
// Route: Individual route mapping (URL path → React component)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Toast notification system for user feedback
// Provides elegant pop-up messages for success/error states
import { Toaster } from 'sonner';

// Authentication context provider and custom hook
// Manages user login state across the entire application
import { AuthProvider } from './hooks/useAuth';

// Higher-order component for route protection
// Controls access to pages based on authentication status
import ProtectedRoute from './components/ProtectedRoute';

// Page components - each represents a different view/screen
import Landing from './pages/Landing';    // Home/marketing page (public)
import Login from './pages/Login';        // User login form (public)
import Signup from './pages/Signup';      // User registration form (public)
import Dashboard from './pages/Dashboard'; // Main app interface (protected)
import StorefrontManagement from './pages/vendor/StorefrontManagement'; // Vendor storefront management (protected)
import StorefrontDashboard from './pages/vendor/StorefrontDashboard'; // Single storefront dashboard (protected)
import BookingPage from './pages/booking/BookingPage'; // Client booking flow (public, auth required for final step)

// ================================================================
// MAIN APP COMPONENT - APPLICATION ENTRY POINT
// ================================================================

/**
 * App Component - Root of the entire React application
 * 
 * This component serves as the foundation for your entire app and handles:
 * 1. Authentication state management (AuthProvider)
 * 2. Client-side routing (React Router)
 * 3. Route protection (ProtectedRoute wrapper)
 * 4. Global UI components (Toast notifications)
 * 
 * Component Hierarchy:
 * App
 * ├── AuthProvider (authentication context)
 * │   └── Router (enables routing)
 * │       ├── Routes (route container)
 * │       │   ├── Route "/" → Landing
 * │       │   ├── Route "/login" → ProtectedRoute → Login
 * │       │   ├── Route "/signup" → ProtectedRoute → Signup
 * │       │   └── Route "/dashboard" → ProtectedRoute → Dashboard
 * │       └── Toaster (global notifications)
 * 
 * Authentication Flow:
 * - Unauthenticated users: Can access /, /login, /signup
 * - Authenticated users: Can access /dashboard, redirected from /login/signup
 * - All authentication logic is handled by AuthProvider + ProtectedRoute
 */
function App() {
  return (
    // ================================================================
    // AUTHENTICATION CONTEXT PROVIDER
    // ================================================================
    
    // AuthProvider wraps the entire app to provide authentication state
    // This makes user data, login/logout functions available to ALL components
    // Components can access auth state using: const { user, login, logout } = useAuth()
    <AuthProvider>
      
      {/* ================================================================ */}
      {/* REACT ROUTER SETUP - CLIENT-SIDE NAVIGATION */}
      {/* ================================================================ */}
      
      {/* BrowserRouter enables client-side routing with clean URLs */}
      {/* URLs like /dashboard work without page refreshes */}
      {/* Uses HTML5 History API instead of hash-based routing */}
      <Router>
        
        {/* Container for all route definitions */}
        {/* React Router will render the component that matches current URL */}
        <Routes>
          
          {/* ============================================================ */}
          {/* PUBLIC ROUTE - LANDING PAGE */}
          {/* ============================================================ */}
          
          {/* Landing page - accessible to everyone */}
          {/* URL: https://yoursite.com/ */}
          {/* Contains marketing content, features, pricing, etc. */}
          <Route path="/" element={<Landing />} />
          
          {/* ============================================================ */}
          {/* AUTHENTICATION ROUTES - LOGIN & SIGNUP */}
          {/* ============================================================ */}
          
          {/* Login page - only for unauthenticated users */}
          {/* URL: https://yoursite.com/login */}
          {/* requireAuth={false} means: */}
          {/* - If user is NOT logged in → show Login page */}
          {/* - If user IS logged in → redirect to /dashboard */}
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            } 
          />
          
          {/* Signup page - only for unauthenticated users */}
          {/* URL: https://yoursite.com/signup */}
          {/* Same logic as login - prevents logged-in users from seeing signup */}
          <Route 
            path="/signup" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Signup />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================================ */}
          {/* PROTECTED ROUTE - DASHBOARD */}
          {/* ============================================================ */}
          
          {/* Dashboard - only for authenticated users */}
          {/* URL: https://yoursite.com/dashboard */}
          {/* requireAuth={true} means: */}
          {/* - If user IS logged in → show Dashboard */}
          {/* - If user is NOT logged in → redirect to /login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireAuth={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* VENDOR ROUTES - PROTECTED */}
          {/* ============================================================ */}

          {/* Storefront Management - Vendor only */}
          <Route
            path="/vendor/storefronts"
            element={
              <ProtectedRoute requireAuth={true}>
                <StorefrontManagement />
              </ProtectedRoute>
            }
          />

          {/* Storefront Dashboard - Single storefront management */}
          <Route
            path="/vendor/storefronts/:id"
            element={
              <ProtectedRoute requireAuth={true}>
                <StorefrontDashboard />
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* CLIENT BOOKING ROUTES - PUBLIC */}
          {/* ============================================================ */}

          {/* Booking Page - Public access (auth required only for final confirmation) */}
          <Route path="/book/:storefrontId" element={<BookingPage />} />

        </Routes>
        
        {/* ============================================================ */}
        {/* GLOBAL NOTIFICATION SYSTEM */}
        {/* ============================================================ */}
        
        {/* Toast notifications appear globally across all pages */}
        {/* Components can trigger toasts using: toast.success("Message") */}
        {/* position="top-right": Toasts appear in top-right corner */}
        {/* richColors: Enables colored toasts (green=success, red=error, etc.) */}
        <Toaster position="top-right" richColors />
        
      </Router>
    </AuthProvider>
  );
}

// ================================================================
// EXPORT APP COMPONENT
// ================================================================

// Export the App component as the default export
// This allows main.tsx to import it with: import App from './App.tsx'
// The App component serves as the root of your component tree
export default App;

// ================================================================
// ROUTING BEHAVIOR SUMMARY
// ================================================================

/**
 * URL Navigation Examples:
 * 
 * 1. User visits "/" (root):
 *    → Always shows Landing page (no authentication required)
 * 
 * 2. User visits "/login":
 *    → If NOT logged in: Shows Login page
 *    → If logged in: Redirects to /dashboard
 * 
 * 3. User visits "/signup":
 *    → If NOT logged in: Shows Signup page  
 *    → If logged in: Redirects to /dashboard
 * 
 * 4. User visits "/dashboard":
 *    → If logged in: Shows Dashboard page
 *    → If NOT logged in: Redirects to /login
 * 
 * 5. User visits any other URL (e.g., "/nonexistent"):
 *    → No route matches, so nothing renders
 *    → Consider adding a 404 page with: <Route path="*" element={<NotFound />} />
 * 
 * Authentication State Management:
 * - AuthProvider maintains login state across page navigation
 * - ProtectedRoute components automatically handle redirects
 * - No manual authentication checks needed in individual pages
 * - Toast notifications provide user feedback for auth actions
 */