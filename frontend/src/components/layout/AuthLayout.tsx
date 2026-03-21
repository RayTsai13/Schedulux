import React from 'react';

// ---------------------------------------------------------------------------
// Abstract PNW topography SVGs for background decoration
// ---------------------------------------------------------------------------
function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
      <svg
        className="absolute -top-24 -left-24 w-[600px] h-[600px] text-outline-variant/30"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M44.7,-76.4C58.3,-69.2,70.1,-57.4,77.6,-43.3C85.1,-29.2,88.4,-12.8,86.6,2.9C84.8,18.6,78,33.7,68.2,46.5C58.4,59.3,45.7,69.9,31.4,75.1C17.1,80.3,1.2,80.2,-14.8,76.5C-30.8,72.8,-46.8,65.5,-59.1,54.4C-71.4,43.3,-80,28.4,-82.9,12.7C-85.8,-3,-83,-19.5,-75.4,-34.2C-67.8,-48.9,-55.5,-61.8,-41.2,-68.7C-26.9,-75.6,-10.6,-76.5,3.6,-82.7C17.7,-88.9,31.1,-83.6,44.7,-76.4Z"
          fill="currentColor"
          transform="translate(100 100)"
        />
      </svg>
      <svg
        className="absolute -bottom-48 -right-24 w-[800px] h-[800px] text-secondary-container/20"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M39.9,-65.7C51.2,-58.4,59.5,-46.7,65.8,-34.1C72,-21.5,76.2,-8.1,75.1,4.9C74.1,17.8,67.8,30.3,58.9,40.8C50,51.3,38.5,59.8,25.8,65.4C13.1,71.1,-0.8,73.8,-15.1,71.8C-29.4,69.7,-44.1,62.8,-55.2,52.2C-66.3,41.6,-73.8,27.3,-76.9,12.2C-80,-2.8,-78.7,-18.6,-71.4,-31.8C-64.2,-45,-51,-55.6,-37.7,-61.8C-24.3,-68.1,-10.7,-70.1,2,-73.6C14.7,-77,28.6,-73,39.9,-65.7Z"
          fill="currentColor"
          transform="translate(100 100)"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal auth footer - matches reference login.html
// ---------------------------------------------------------------------------
function AuthFooter() {
  return (
    <footer
      className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-low"
      style={{ borderTop: '1px solid rgba(191,201,195,0.15)' }}
    >
      <div className="text-xs font-label text-outline">
        © 2026 Schedulux. Rooted in the Pacific Northwest.
      </div>
      <div className="flex gap-6">
        <a href="#" className="text-xs font-label text-outline hover:text-tertiary transition-all">
          Privacy Policy
        </a>
        <a href="#" className="text-xs font-label text-outline hover:text-tertiary transition-all">
          Sustainability Pact
        </a>
        <a href="#" className="text-xs font-label text-outline hover:text-tertiary transition-all">
          Contact Support
        </a>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// The Editorial Earth input styles — bottom-border only, no rounded borders
// ---------------------------------------------------------------------------
export const editorialInputClass =
  'w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/30 py-3 px-4 focus:ring-0 focus:border-primary focus:outline-none transition-all font-body text-on-surface placeholder-outline';

// ---------------------------------------------------------------------------
// AuthLayout — shared wrapper for Login, Register, ForgotPassword
// ---------------------------------------------------------------------------
interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon?: string;
}

export default function AuthLayout({ children, title, subtitle, icon = 'nature' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface antialiased flex flex-col">
      <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <BackgroundDecoration />
        <div className="z-10 w-full max-w-md">
          {/* Brand Anchor */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-container mb-6">
              <span
                className="material-symbols-outlined text-on-secondary-container text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {icon}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 font-headline">
              {title}
            </h1>
            <p className="font-body text-on-surface-variant">{subtitle}</p>
          </div>

          {/* Content (card + footer links) */}
          {children}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
