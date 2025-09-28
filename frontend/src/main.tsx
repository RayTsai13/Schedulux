// ================================================================
// REACT APPLICATION ENTRY POINT
// ================================================================

// Import React's StrictMode component for development-time checks
// StrictMode enables additional warnings and checks to help catch bugs early
import { StrictMode } from 'react';

// Import createRoot from React 18's new concurrent rendering API
// This replaces the legacy ReactDOM.render() method and enables React 18 features
import { createRoot } from 'react-dom/client';

// Import our main App component - the root of our component tree
// This contains all routing, authentication, and page components
import App from './App.tsx';

// Import global CSS styles that apply to the entire application
// This includes Tailwind CSS utilities and custom global styles
import './index.css';

// ================================================================
// REACT APPLICATION INITIALIZATION
// ================================================================

/**
 * Bootstrap the React application and mount it to the DOM
 * 
 * Process Flow:
 * 1. Find the HTML element with id="root" in public/index.html
 * 2. Create a React root using React 18's createRoot API
 * 3. Render the App component tree into that DOM element
 * 4. React takes control of that element and all its children
 * 
 * DOM Structure After Rendering:
 * <div id="root">
 *   <!-- React-generated content starts here -->
 *   <App>
 *     <AuthProvider>
 *       <Router>
 *         <Routes>
 *           <!-- Your page components render here -->
 *         </Routes>
 *       </Router>
 *     </AuthProvider>
 *   </App>
 *   <!-- React-generated content ends here -->
 * </div>
 */

// Find the root DOM element where React will mount the application
// The "!" (non-null assertion) tells TypeScript we're confident this element exists
// This element is defined in public/index.html: <div id="root"></div>
createRoot(document.getElementById('root')!).render(
  
  // Wrap the entire app in StrictMode for development benefits:
  // - Detects unsafe lifecycles and legacy API usage
  // - Warns about deprecated findDOMNode usage
  // - Helps identify side effects by double-invoking functions
  // - Validates that hooks follow the rules of hooks
  // Note: StrictMode only runs checks in development, not production
  <StrictMode>
    
    {/* Render the main App component */}
    {/* This component contains all routing logic, authentication providers, */}
    {/* and serves as the entry point to your entire component tree */}
    <App />
    
  </StrictMode>
);
