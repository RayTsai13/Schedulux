import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav items
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { label: 'Overview', icon: 'dashboard', href: '/dashboard' },
  { label: 'Storefronts', icon: 'storefront', href: '/dashboard/storefronts' },
  { label: 'Calendar', icon: 'calendar_today', href: '/dashboard/calendar' },
  { label: 'Appointments', icon: 'event_available', href: '/dashboard/appointments' },
  { label: 'Customers', icon: 'group', href: '/dashboard/customers' },
];

const MOBILE_NAV = [
  { label: 'Home', icon: 'home', href: '/dashboard' },
  { label: 'Metrics', icon: 'bar_chart', href: '/dashboard/analytics' },
  { label: 'Schedule', icon: 'event', href: '/dashboard/calendar' },
  { label: 'Account', icon: 'person', href: '/dashboard/settings' },
];

// ---------------------------------------------------------------------------
// DashboardLayout
// ---------------------------------------------------------------------------
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title = 'Dashboard' }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Vendor';

  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface antialiased flex">

      {/* ============================================================
       * SIDEBAR — Desktop only
       * ============================================================ */}
      <aside className="hidden lg:flex flex-col h-screen sticky left-0 top-0 p-6 bg-surface-container-low w-64 shrink-0">
        {/* Brand */}
        <div className="flex flex-col gap-1 mb-10 px-4">
          <a href="/" className="text-xl font-bold text-primary font-headline">Schedulux</a>
          <span className="text-xs font-label text-on-surface-variant tracking-wider uppercase">
            Business Hub
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => { e.preventDefault(); navigate(item.href); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-label ${
                  isActive
                    ? 'bg-secondary-container text-primary font-semibold translate-x-1'
                    : 'text-on-surface-variant hover:bg-secondary-container/50'
                }`}
              >
                <Icon name={item.icon} fill={isActive} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="mt-auto pt-6 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(191,201,195,0.15)' }}>
          <button
            onClick={() => navigate('/dashboard/storefronts')}
            className="mb-4 bg-primary text-on-primary px-4 py-3 rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
          >
            <Icon name="add" className="text-sm" />
            Add New Service
          </button>
          <a
            href="#"
            className="flex items-center gap-3 text-on-surface-variant px-4 py-2 text-sm hover:text-primary transition-colors"
          >
            <Icon name="help" className="text-[20px]" />
            Support
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-error px-4 py-2 text-sm hover:opacity-80 transition-opacity"
          >
            <Icon name="logout" className="text-[20px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* ============================================================
       * MAIN CONTENT
       * ============================================================ */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">

        {/* Top bar */}
        <header className="sticky top-0 z-50 flex justify-between items-center w-full px-8 py-6 max-w-screen-2xl mx-auto bg-surface">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">{title}</h1>
            <span className="text-on-surface-variant text-sm font-body hidden md:inline">
              Welcome back, {userName}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <input
                className="bg-surface-container-low border-0 border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 text-sm font-body px-4 py-2 w-64 transition-all placeholder-outline"
                placeholder="Search insights..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <button className="material-symbols-outlined hover:text-primary transition-colors">
                notifications
              </button>
              <button className="material-symbols-outlined hover:text-primary transition-colors">
                settings
              </button>
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden">
                <span className="text-sm font-bold text-on-secondary-container">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content canvas */}
        <div className="px-8 py-4 max-w-screen-2xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ============================================================
       * MOBILE BOTTOM NAV
       * ============================================================ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 backdrop-blur-md rounded-t-3xl"
        style={{
          backgroundColor: 'rgba(251,249,245,0.80)',
          borderTop: '1px solid rgba(191,201,195,0.15)',
          boxShadow: '0 -10px 30px rgba(27,28,26,0.03)',
        }}
      >
        {MOBILE_NAV.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => { e.preventDefault(); navigate(item.href); }}
              className={`flex flex-col items-center justify-center px-5 py-2 transition-transform ${
                isActive
                  ? 'bg-secondary-container text-primary rounded-2xl scale-95'
                  : 'text-on-surface-variant'
              }`}
            >
              <Icon name={item.icon} fill={isActive} />
              <span className="text-[10px] font-medium font-label mt-1">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
