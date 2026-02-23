import React from 'react';
import UniversalButton from '../universal/UniversalButton';

interface AppScaffoldProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export default function AppScaffold({ children, showNav = true }: AppScaffoldProps) {
  return (
    <div className="min-h-screen w-full bg-v3-background font-sans text-v3-primary antialiased">
      {/* Navbar - Sticky Top */}
      {showNav && (
        <nav className="sticky top-0 z-50 bg-v3-surface/80 backdrop-blur-md border-b border-v3-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo - Left */}
            <div className="font-bold text-xl">Schedulux</div>

            {/* Nav Actions - Right */}
            <div className="flex items-center gap-4">
              <UniversalButton variant="ghost" size="sm">
                Login
              </UniversalButton>
              <UniversalButton variant="primary" size="sm">
                Sign Up
              </UniversalButton>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
