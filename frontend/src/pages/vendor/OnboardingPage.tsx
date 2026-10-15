import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute, { FullPageSpinner } from '../../components/auth/ProtectedRoute';
import PageSettingsForm from '../../components/vendor/PageSettingsForm';
import { useCreateStorefront, useMyStorefront } from '../../hooks/useStorefronts';

function Onboarding() {
  const navigate = useNavigate();
  const { data: page, isLoading } = useMyStorefront();
  const create = useCreateStorefront();
  // Set once we've created the page, so the refetched page doesn't trigger the "already set up" redirect
  const [justCreated, setJustCreated] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (page && !justCreated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface antialiased">
      <div className="max-w-xl mx-auto px-4 sm:px-8 py-16">
        <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tighter">Claim your link</h1>
        <p className="text-on-surface-variant mt-3 mb-10 leading-relaxed">
          This is the page you'll put in your bio. Clients book from it without making an account.
          You can change any of this later.
        </p>
        <PageSettingsForm
          submitLabel="Create my page"
          isSubmitting={create.isPending}
          onSubmit={async (data) => {
            const response = await create.mutateAsync(data);
            if (response.success) {
              setJustCreated(true);
              navigate('/dashboard/page?tab=services', { replace: true });
            }
          }}
        />
      </div>
    </div>
  );
}

/**
 * First-run setup for vendors who haven't created their page yet
 */
export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  );
}
