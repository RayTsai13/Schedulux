import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut } from 'lucide-react';
import UniversalButton from '../universal/UniversalButton';
import { useAuth } from '../../hooks/useAuth';

interface AppScaffoldProps {
  children: React.ReactNode;
  showNav?: boolean;
  noPadding?: boolean;
}

export default function AppScaffold({ children, showNav = true, noPadding = false }: AppScaffoldProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-surface font-sans text-on-surface antialiased">
      {/* Navbar - Sticky Top */}
      {showNav && (
        <nav className="sticky top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo - Left */}
            <a href="/" className="font-bold text-xl hover:text-primary transition-colors">
              Schedulux
            </a>

            {/* Nav Actions - Right */}
            <div className="flex items-center gap-6">
              <a href="/explore" className="text-on-surface-variant hover:text-on-surface font-medium transition-colors">
                Explore
              </a>

              {!isAuthenticated ? (
                // Not logged in - Show Login/Signup
                <div className="flex items-center gap-4">
                  <UniversalButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </UniversalButton>
                  <UniversalButton
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/register')}
                  >
                    Sign Up
                  </UniversalButton>
                </div>
              ) : (
                // Logged in - Show role-specific links + user menu
                <div className="flex items-center gap-6">
                  {user?.role === 'admin' ? (
                    <a
                      href="/admin"
                      className="text-on-surface-variant hover:text-on-surface font-medium transition-colors"
                    >
                      Admin
                    </a>
                  ) : user?.role === 'vendor' ? (
                    <a
                      href="/dashboard"
                      className="text-on-surface-variant hover:text-on-surface font-medium transition-colors"
                    >
                      Dashboard
                    </a>
                  ) : (
                    <a
                      href="/my-appointments"
                      className="text-on-surface-variant hover:text-on-surface font-medium transition-colors"
                    >
                      My Appointments
                    </a>
                  )}

                  {/* User Menu Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user?.first_name}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowUserMenu(false)}
                        />

                        {/* Menu Content */}
                        <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-outline-variant">
                            <p className="text-sm font-medium text-on-surface">
                              {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {user?.email}
                            </p>
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              {user?.role === 'admin' ? 'Admin' : user?.role === 'vendor' ? 'Vendor' : 'Client'}
                            </span>
                          </div>

                          {/* Logout Button */}
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 flex items-center gap-2 text-sm text-on-surface-variant hover:bg-surface hover:text-on-surface transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={noPadding ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {children}
      </main>
    </div>
  );
}
