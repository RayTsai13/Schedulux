import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { useStorefront } from '../../hooks/useStorefronts';
import { useServices, useDeleteService } from '../../hooks/useServices';
import { useScheduleRules, useDeleteScheduleRule } from '../../hooks/useScheduleRules';
import { useDrops, useDeleteDrop } from '../../hooks/useDrops';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import ServiceFormModal from '../../components/vendor/ServiceFormModal';
import ScheduleRuleFormModal from '../../components/vendor/ScheduleRuleFormModal';
import DropFormModal from '../../components/vendor/DropFormModal';
import ServicesTab from '../../components/vendor/ServicesTab';
import AvailabilityTab from '../../components/vendor/AvailabilityTab';
import DropsTab from '../../components/vendor/DropsTab';
import Tabs from '../../components/ui/Tabs';
import type { Service, ScheduleRule, Drop } from '../../services/api';

export default function StorefrontDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storefrontId = id ? parseInt(id) : null;

  const { data: storefront, isLoading: storefrontLoading } = useStorefront(storefrontId);
  const { data: services, isLoading: servicesLoading } = useServices(storefrontId);
  const { data: scheduleRules, isLoading: rulesLoading } = useScheduleRules(storefrontId);
  const { data: drops, isLoading: dropsLoading } = useDrops(storefrontId);
  const deleteService = useDeleteService(storefrontId);
  const deleteRule = useDeleteScheduleRule(storefrontId);
  const deleteDrop = useDeleteDrop(storefrontId);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);
  const [showDropModal, setShowDropModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);

  const isLoading = storefrontLoading || servicesLoading || rulesLoading || dropsLoading;

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService.mutateAsync(serviceId);
    }
  };

  const handleCloseServiceModal = () => {
    setShowServiceModal(false);
    setEditingService(null);
  };

  const handleEditRule = (rule: ScheduleRule) => {
    setEditingRule(rule);
    setShowRuleModal(true);
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (confirm('Delete this availability rule?')) {
      await deleteRule.mutateAsync(ruleId);
    }
  };

  const handleCloseRuleModal = () => {
    setShowRuleModal(false);
    setEditingRule(null);
  };

  const handleEditDrop = (drop: Drop) => {
    setEditingDrop(drop);
    setShowDropModal(true);
  };

  const handleDeleteDrop = async (dropId: number) => {
    if (confirm('Delete this drop?')) {
      await deleteDrop.mutateAsync(dropId);
    }
  };

  const handleCloseDropModal = () => {
    setShowDropModal(false);
    setEditingDrop(null);
  };

  if (isLoading) {
    return (
      <AppScaffold>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-v3-accent border-r-transparent" />
            <p className="mt-4 text-v3-secondary">Loading storefront...</p>
          </div>
        </div>
      </AppScaffold>
    );
  }

  if (!storefront) {
    return (
      <AppScaffold>
        <div className="text-center py-12">
          <p className="text-v3-secondary mb-4">Storefront not found</p>
          <UniversalButton variant="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </UniversalButton>
        </div>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-v3-secondary hover:text-v3-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Storefront Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-v3-primary mb-2">{storefront.name}</h1>
            {storefront.description && (
              <p className="text-v3-secondary mb-4">{storefront.description}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap text-sm text-v3-secondary">
              {(storefront.city || storefront.address) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {storefront.location_type === 'mobile' || storefront.location_type === 'hybrid'
                      ? `${storefront.service_area_city}, ${storefront.state}`
                      : storefront.address || `${storefront.city}, ${storefront.state}`}
                  </span>
                </div>
              )}
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-v3-accent/10 text-v3-accent rounded-full">
                {storefront.profile_type === 'individual' ? 'Individual' : 'Business'}
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-v3-primary/10 text-v3-primary rounded-full">
                {storefront.location_type === 'fixed'
                  ? 'Fixed Location'
                  : storefront.location_type === 'mobile'
                  ? 'Mobile Service'
                  : 'Hybrid'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <UniversalButton
              variant="outline"
              onClick={() => navigate(`/book/${storefront.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Public Profile
            </UniversalButton>
            <UniversalButton
              variant="outline"
              onClick={() => navigate(`/dashboard/storefront/${storefront.id}/calendar`)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </UniversalButton>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultTab="drops"
          tabs={[
            {
              id: 'drops',
              label: 'Drops',
              content: (
                <DropsTab
                  drops={drops}
                  onAddDrop={() => setShowDropModal(true)}
                  onEditDrop={handleEditDrop}
                  onDeleteDrop={handleDeleteDrop}
                />
              ),
            },
            {
              id: 'services',
              label: 'Services',
              content: (
                <ServicesTab
                  services={services}
                  onAddService={() => setShowServiceModal(true)}
                  onEditService={handleEditService}
                  onDeleteService={handleDeleteService}
                />
              ),
            },
            {
              id: 'availability',
              label: 'Regular Hours',
              content: (
                <AvailabilityTab
                  storefrontId={storefrontId!}
                  scheduleRules={scheduleRules}
                  drops={drops}
                  onAddRule={() => setShowRuleModal(true)}
                  onEditRule={handleEditRule}
                  onDeleteRule={handleDeleteRule}
                />
              ),
            },
          ]}
        />
      </div>

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={showServiceModal}
        onClose={handleCloseServiceModal}
        storefrontId={storefrontId!}
        service={editingService}
      />

      {/* Schedule Rule Form Modal */}
      <ScheduleRuleFormModal
        isOpen={showRuleModal}
        onClose={handleCloseRuleModal}
        storefrontId={storefrontId!}
        rule={editingRule}
      />

      {/* Drop Form Modal */}
      <DropFormModal
        isOpen={showDropModal}
        onClose={handleCloseDropModal}
        storefrontId={storefrontId!}
        drop={editingDrop}
        services={services}
      />
    </AppScaffold>
  );
}
