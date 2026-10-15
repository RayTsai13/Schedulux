import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVendorPage } from '../../components/auth/VendorRoute';
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
import { copyLink, pageUrl } from '../../lib/booking';

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
  { id: 'drops', label: 'Drops', icon: 'new_releases' },
  { id: 'services', label: 'Services', icon: 'design_services' },
  { id: 'availability', label: 'Regular Hours', icon: 'schedule' },
];

const isTab = (value: string | null): value is TabId => TAB_CONFIG.some((t) => t.id === value);

// ---------------------------------------------------------------------------
// PageManagerPage — drops, services, and hours for the vendor's one page
// ---------------------------------------------------------------------------
export default function PageManagerPage() {
  const navigate = useNavigate();
  const storefront = useVendorPage();
  const storefrontId = storefront.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabId = isTab(tabParam) ? tabParam : 'drops';
  const setActiveTab = (tab: TabId) => setSearchParams({ tab }, { replace: true });

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

  const isLoading = servicesLoading || rulesLoading || dropsLoading;
  const link = pageUrl(storefront.slug);

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
      <DashboardLayout title="My Page">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Page">
      <div className="space-y-16 pb-12">

        {/* ============================================================
         * HERO — the shareable link front and center
         * ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-primary leading-none tracking-tighter mb-6">
              {storefront.name}
            </h1>
            {storefront.description && (
              <p className="text-xl text-on-surface-variant max-w-xl font-body leading-relaxed mb-8">
                {storefront.description}
              </p>
            )}

            <div className="flex items-stretch gap-2 max-w-xl mb-6">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-4 py-3 rounded-md bg-surface-container-low text-on-surface font-mono text-sm border border-outline-variant"
                aria-label="Your page link"
              />
              <button
                onClick={() => copyLink(link, 'Page link')}
                className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold hover:bg-primary-container transition-all flex items-center gap-2"
              >
                <Icon name="content_copy" className="text-lg" />
                Copy
              </button>
            </div>

            <div className="flex gap-4 flex-wrap">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-md font-bold hover:bg-secondary-fixed transition-all flex items-center gap-2"
              >
                <Icon name="open_in_new" className="text-lg" />
                View page
              </a>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="text-primary px-6 py-3 rounded-md font-bold hover:bg-surface-container-low transition-all flex items-center gap-2"
              >
                <Icon name="tune" className="text-lg" />
                Edit details
              </button>
            </div>
          </div>

          {/* Stats card */}
          <div className="lg:col-span-4">
            <div
              className="bg-surface-container-lowest p-6 rounded-xl flex items-center gap-6"
              style={{ border: '1px solid rgba(191,201,195,0.10)', boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
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
                  {drops?.length ?? 0} Drops
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
                slug={storefront.slug}
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
                storefrontId={storefrontId}
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
              Post a drop.
            </h2>
            <p className="text-xl text-on-surface-variant mb-10 leading-relaxed">
              Limited sessions sell out faster than open calendars. Create a drop, share its link, and let the countdown do the work.
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
      <ServiceFormModal isOpen={showServiceModal} onClose={handleCloseServiceModal} storefrontId={storefrontId} service={editingService} />
      <ScheduleRuleFormModal isOpen={showRuleModal} onClose={handleCloseRuleModal} storefrontId={storefrontId} rule={editingRule} />
      <DropFormModal isOpen={showDropModal} onClose={handleCloseDropModal} storefrontId={storefrontId} drop={editingDrop} services={services} />
    </DashboardLayout>
  );
}
