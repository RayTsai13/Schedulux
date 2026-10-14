import DashboardLayout from '../../components/layout/DashboardLayout';
import PageSettingsForm from '../../components/vendor/PageSettingsForm';
import { useVendorPage } from '../../components/auth/VendorRoute';
import { useUpdateStorefront } from '../../hooks/useStorefronts';

export default function PageSettingsPage() {
  const page = useVendorPage();
  const update = useUpdateStorefront();

  return (
    <DashboardLayout title="Page Settings">
      <div className="max-w-xl pb-12">
        <p className="text-on-surface-variant mb-8">
          Changing your link breaks the old one, so update your bio if you do.
        </p>
        <PageSettingsForm
          page={page}
          submitLabel="Save changes"
          isSubmitting={update.isPending}
          onSubmit={(data) => update.mutate({ id: page.id, data })}
        />
      </div>
    </DashboardLayout>
  );
}
