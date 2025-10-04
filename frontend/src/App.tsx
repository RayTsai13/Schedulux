// ================================================================
// SIMPLIFIED LANDING PAGE APP
// ================================================================ 

// Toast notification system for user feedback
import { Toaster } from 'sonner';

// Landing page component
import Landing from './pages/Landing';

// ================================================================
// MAIN APP COMPONENT - SIMPLIFIED LANDING PAGE ONLY
// ================================================================

/**
 * App Component - Simplified for landing page deployment
 * 
 * This version removes all authentication and routing complexity
 * to focus solely on the landing page experience for quick deployment.
 */
function App() {
  return (
    <>
      {/* Landing page with all sections */}
      <Landing />
      
      {/* Global notification system for email signup feedback */}
      <Toaster position="top-right" richColors />
    </>
  );
}

// ================================================================
// EXPORT APP COMPONENT
// ================================================================

export default App;