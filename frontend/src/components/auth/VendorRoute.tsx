import { createContext, useContext, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute, { FullPageSpinner } from './ProtectedRoute';
import { useMyStorefront } from '../../hooks/useStorefronts';
import type { Storefront } from '../../services/api';

const VendorPageContext = createContext<Storefront | null>(null);

/**
 * The signed-in vendor's booking page. Only usable under <VendorRoute>.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useVendorPage(): Storefront {
  const page = useContext(VendorPageContext);
  if (!page) {
    throw new Error('useVendorPage must be used inside <VendorRoute>');
  }
  return page;
}

function RequirePage({ children }: { children: ReactNode }) {
  const { data: page, isLoading, isError } = useMyStorefront();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return (
      <div className="min-h-screen w-full bg-surface flex items-center justify-center">
        <p className="text-error">Couldn't load your page. Refresh to try again.</p>
      </div>
    );
  }

  if (!page) {
    return <Navigate to="/onboarding" replace />;
  }

  return <VendorPageContext.Provider value={page}>{children}</VendorPageContext.Provider>;
}

/**
 * Dashboard routes: requires a signed-in vendor who has created their page.
 * Vendors without a page are sent to onboarding.
 */
export default function VendorRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <RequirePage>{children}</RequirePage>
    </ProtectedRoute>
  );
}
