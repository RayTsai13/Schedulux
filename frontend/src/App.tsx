// ================================================================
// SIMPLIFIED LANDING PAGE APP WITH POLICY PAGES
// ================================================================

// Routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Toast notification system for user feedback
import { Toaster } from 'sonner';

// Page components
import Landing from './pages/Landing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';

// ================================================================
// MAIN APP COMPONENT - LANDING PAGE WITH POLICY PAGES
// ================================================================

/**
 * App Component - Landing page with legal policy pages
 *
 * Includes routing for Privacy Policy, Terms of Service, and Cookie Policy
 */
function App() {
  return (
    <BrowserRouter>
      {/* Main routes */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
      </Routes>

      {/* Global notification system for email signup feedback */}
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

// ================================================================
// EXPORT APP COMPONENT
// ================================================================

export default App;