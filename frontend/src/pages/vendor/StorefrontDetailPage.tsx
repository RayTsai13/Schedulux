import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStorefront } from '../../hooks/useStorefronts';
import { useServices, useDeleteService } from '../../hooks/useServices';
import { useScheduleRules, useDeleteScheduleRule } from '../../hooks/useScheduleRules';
import { useDrops, useDeleteDrop } from '../../hooks/useDrops';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ServiceFormModal from '../../components/vendor/ServiceFormModal';
import ScheduleRuleFormModal from '../../components/vendor/ScheduleRuleFormModal';
import DropFormModal from '../../components/vendor/DropFormModal';
import ServicesTab from '../../components/vendor/ServicesTab';
import AvailabilityTab from '../../components/vendor/AvailabilityTab';
import DropsTab from '../../components/vendor/DropsTab';
import type { Service, ScheduleRule, Drop } from '../../services/api';

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
// Tab system
// ---------------------------------------------------------------------------
type TabId = 'drops' | 'services' | 'availability';

const TAB_CONFIG: { id: TabId; label: string; icon: string }[] = [
  { id: 'drops', label: 'Upcoming Drops', icon: 'new_releases' },
  { id: 'services', label: 'Services', icon: 'design_services' },
  { id: 'availability', label: 'Regular Hours', icon: 'schedule' },
];

// ---------------------------------------------------------------------------
// StorefrontDetailPage
// ---------------------------------------------------------------------------
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

  const [activeTab, setActiveTab] = useState<TabId>('drops');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);
  const [showDropModal, setShowDropModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);

  const isLoading = storefrontLoading || servicesLoading || rulesLoading || dropsLoading;

  // Handlers
  const handleEditService = (service: Service) => { setEditingService(service); setShowServiceModal(true); };
  const handleDeleteService = async (serviceId: number) => { if (confirm('Delete this service?')) await deleteService.mutateAsync(serviceId); };
  const handleCloseServiceModal = () => { setShowServiceModal(false); setEditingService(null); };
  const handleEditRule = (rule: ScheduleRule) => { setEditingRule(rule); setShowRuleModal(true); };
  const handleDeleteRule = async (ruleId: number) => { if (confirm('Delete this rule?')) await deleteRule.mutateAsync(ruleId); };
  const handleCloseRuleModal = () => { setShowRuleModal(false); setEditingRule(null); };
  const handleEditDrop = (drop: Drop) => { setEditingDrop(drop); setShowDropModal(true); };
  const handleDeleteDrop = async (dropId: number) => { if (confirm('Delete this drop?')) await deleteDrop.mutateAsync(dropId); };
  const handleCloseDropModal = () => { setShowDropModal(false); setEditingDrop(null); };

  // Loading
  if (isLoading) {
    return (
      <DashboardLayout title="Storefront">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Not found
  if (!storefront) {
    return (
      <DashboardLayout title="Storefront">
        <div className="text-center py-24">
          <Icon name="storefront" className="text-6xl text-outline mb-6" />
          <h3 className="text-2xl font-bold text-primary mb-2 font-headline">Storefront not found</h3>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-primary font-bold flex items-center gap-1 mx-auto hover:underline underline-offset-4"
          >
            <Icon name="arrow_back" className="text-sm" />
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Location string
  const locationStr = storefront.location_type === 'mobile' || storefront.location_type === 'hybrid'
    ? `${storefront.service_area_city || storefront.city}, ${storefront.state}`
    : storefront.address || `${storefront.city}, ${storefront.state}`;

  return (
    <DashboardLayout title="Storefront">
      <div className="space-y-16 pb-12">

        {/* ============================================================
         * BREADCRUMB
         * ============================================================ */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-label"
        >
          <Icon name="arrow_back" className="text-sm" />
          Back to Dashboard
        </Link>

        {/* ============================================================
         * ARTISAN HERO SECTION
         * ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            {/* Badges */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-xs font-bold font-label tracking-wider uppercase">
                {storefront.profile_type === 'individual' ? 'Independent' : 'Business'}
              </span>
              <span className="text-on-surface-variant font-label text-sm italic">
                {storefront.location_type === 'fixed' ? 'Fixed Location' : storefront.location_type === 'mobile' ? 'Mobile Service' : 'Hybrid'}
                {locationStr && ` • ${locationStr}`}
              </span>
              {storefront.is_verified && (
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold font-label tracking-wider uppercase flex items-center gap-1">
                  <Icon name="verified" fill className="text-sm" />
                  Verified
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-primary leading-none tracking-tighter mb-8">
              {storefront.name}
            </h1>

            {/* Description */}
            {storefront.description && (
              <p className="text-xl text-on-surface-variant max-w-xl font-body leading-relaxed mb-8">
                {storefront.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => navigate(`/book/${storefront.id}`)}
                className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold hover:bg-primary-container transition-all flex items-center gap-2"
              >
                Public Profile <Icon name="arrow_forward" />
              </button>
              <button
                onClick={() => navigate(`/dashboard/storefront/${storefront.id}/calendar`)}
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-md font-bold hover:bg-secondary-fixed transition-all flex items-center gap-2"
              >
                <Icon name="calendar_today" className="text-lg" />
                Appointments
              </button>
            </div>
          </div>

          {/* Hero image area */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-low">
              {storefront.avatar_url ? (
                <img
                  src={storefront.avatar_url}
                  alt={storefront.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary-container to-surface-container-high flex items-center justify-center">
                  <Icon name="storefront" className="text-[120px] text-primary/20" />
                </div>
              )}
            </div>

            {/* Floating stats card */}
            <div
              className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-6 rounded-xl shadow-2xl flex items-center gap-6"
              style={{ border: '1px solid rgba(191,201,195,0.10)' }}
            >
              <div className="flex flex-col">
                <span className="text-tertiary font-bold font-label text-sm uppercase tracking-widest mb-1">
                  Services
                </span>
                <span className="text-4xl font-headline font-extrabold text-primary">
                  {services?.length ?? 0}
                </span>
              </div>
              <div className="h-12 w-[2px] bg-outline-variant/30" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-on-secondary-fixed-variant text-sm font-semibold">
                  <Icon name="schedule" className="text-[18px]" />
                  {scheduleRules?.length ?? 0} Schedule Rules
                </div>
                <div className="flex items-center gap-2 text-on-secondary-fixed-variant text-sm font-semibold">
                  <Icon name="new_releases" className="text-[18px]" />
                  {drops?.length ?? 0} Active Drops
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
         * MANAGEMENT TABS
         * ============================================================ */}
        <section className="pt-8">
          {/* Tab header */}
          <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
            <div className="flex gap-2">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-label font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-secondary-container text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Icon name={tab.icon} className="text-lg" fill={activeTab === tab.id} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="bg-surface-container-lowest rounded-xl p-8" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            {activeTab === 'drops' && (
              <DropsTab
                drops={drops}
                onAddDrop={() => setShowDropModal(true)}
                onEditDrop={handleEditDrop}
                onDeleteDrop={handleDeleteDrop}
              />
            )}
            {activeTab === 'services' && (
              <ServicesTab
                services={services}
                onAddService={() => setShowServiceModal(true)}
                onEditService={handleEditService}
                onDeleteService={handleDeleteService}
              />
            )}
            {activeTab === 'availability' && (
              <AvailabilityTab
                storefrontId={storefrontId!}
                scheduleRules={scheduleRules}
                drops={drops}
                onAddRule={() => setShowRuleModal(true)}
                onEditRule={handleEditRule}
                onDeleteRule={handleDeleteRule}
              />
            )}
          </div>
        </section>

        {/* ============================================================
         * COMMUNITY CTA
         * ============================================================ */}
        <section className="bg-surface-container-high rounded-3xl p-12 md:p-20 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-primary mb-6">
              Grow Your Presence.
            </h2>
            <p className="text-xl text-on-surface-variant mb-10 leading-relaxed">
              Add more services, set up your availability windows, and create limited drops to attract new customers from the community.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => { setActiveTab('services'); setShowServiceModal(true); }}
                className="bg-primary text-on-primary px-10 py-4 rounded-md font-bold hover:bg-primary-container transition-all flex items-center gap-2"
              >
                <Icon name="add" />
                Add Service
              </button>
              <button
                onClick={() => { setActiveTab('drops'); setShowDropModal(true); }}
                className="bg-secondary-container text-on-secondary-container px-10 py-4 rounded-md font-bold hover:bg-secondary-fixed transition-all flex items-center gap-2"
              >
                <Icon name="new_releases" />
                Create Drop
              </button>
            </div>
          </div>
          {/* Decorative */}
          <Icon name="park" fill className="absolute -right-20 -bottom-20 text-[400px] text-primary/5 select-none pointer-events-none" />
        </section>
      </div>

      {/* Modals */}
      <ServiceFormModal isOpen={showServiceModal} onClose={handleCloseServiceModal} storefrontId={storefrontId!} service={editingService} />
      <ScheduleRuleFormModal isOpen={showRuleModal} onClose={handleCloseRuleModal} storefrontId={storefrontId!} rule={editingRule} />
      <DropFormModal isOpen={showDropModal} onClose={handleCloseDropModal} storefrontId={storefrontId!} drop={editingDrop} services={services} />
    </DashboardLayout>
  );
}
