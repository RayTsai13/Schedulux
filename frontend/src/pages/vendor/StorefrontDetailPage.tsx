import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  ArrowLeft,
  MapPin,
  ExternalLink,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Trash2,
} from 'lucide-react';
import { useStorefront } from '../../hooks/useStorefronts';
import { useServices, useDeleteService } from '../../hooks/useServices';
import { useScheduleRules, useDeleteScheduleRule, formatScheduleRule } from '../../hooks/useScheduleRules';
import AppScaffold from '../../components/layout/AppScaffold';
import UniversalButton from '../../components/universal/UniversalButton';
import UniversalCard from '../../components/universal/UniversalCard';
import ServiceFormModal from '../../components/vendor/ServiceFormModal';
import ScheduleRuleFormModal from '../../components/vendor/ScheduleRuleFormModal';
import type { Service, ScheduleRule } from '../../services/api';

export default function StorefrontDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storefrontId = id ? parseInt(id) : null;

  const { data: storefront, isLoading: storefrontLoading } = useStorefront(storefrontId);
  const { data: services, isLoading: servicesLoading } = useServices(storefrontId);
  const { data: scheduleRules, isLoading: rulesLoading } = useScheduleRules(storefrontId);
  const deleteService = useDeleteService(storefrontId);
  const deleteRule = useDeleteScheduleRule(storefrontId);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);

  const isLoading = storefrontLoading || servicesLoading || rulesLoading;

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService.mutateAsync(serviceId);
    }
  };

  const handleCloseModal = () => {
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-v3-primary mb-2">
              {storefront.name}
            </h1>
            {storefront.description && (
              <p className="text-v3-secondary mb-4">{storefront.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-v3-secondary">
              {(storefront.city || storefront.address) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {storefront.location_type === 'mobile' || storefront.location_type === 'hybrid'
                      ? `${storefront.service_area_city}, ${storefront.state}`
                      : storefront.address || `${storefront.city}, ${storefront.state}`
                    }
                  </span>
                </div>
              )}
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-v3-accent/10 text-v3-accent rounded-full">
                {storefront.profile_type === 'individual' ? 'Individual' : 'Business'}
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-v3-primary/10 text-v3-primary rounded-full">
                {storefront.location_type === 'fixed' ? 'Fixed Location' :
                 storefront.location_type === 'mobile' ? 'Mobile Service' : 'Hybrid'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UniversalButton
              variant="outline"
              onClick={() => navigate(`/book/${storefront.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Profile
            </UniversalButton>
            <UniversalButton
              variant="primary"
              onClick={() => navigate(`/dashboard/storefront/${storefront.id}/calendar`)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </UniversalButton>
          </div>
        </div>

        {/* Services Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-v3-primary">Services</h2>
            <UniversalButton
              variant="primary"
              size="md"
              onClick={() => setShowServiceModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </UniversalButton>
          </div>

          {!services || services.length === 0 ? (
            <UniversalCard className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-v3-secondary/50" />
              <h3 className="text-lg font-semibold text-v3-primary mb-2">
                No services yet
              </h3>
              <p className="text-v3-secondary mb-4">
                Add services that customers can book
              </p>
              <UniversalButton
                variant="primary"
                onClick={() => setShowServiceModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </UniversalButton>
            </UniversalCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <UniversalCard key={service.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-v3-primary mb-1">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-v3-secondary line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {service.price && (
                      <div className="flex items-center gap-2 text-sm text-v3-secondary">
                        <DollarSign className="w-4 h-4" />
                        <span>${service.price}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-v3-secondary">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration_minutes} min</span>
                    </div>
                    {service.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-v3-accent/10 text-v3-accent rounded-full">
                        {service.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-v3-border">
                    <UniversalButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </UniversalButton>
                    <UniversalButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </UniversalButton>
                  </div>
                </UniversalCard>
              ))}
            </div>
          )}
        </div>

        {/* Availability Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-v3-primary">Availability</h2>
            <UniversalButton
              variant="primary"
              size="md"
              onClick={() => setShowRuleModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </UniversalButton>
          </div>

          {!scheduleRules || scheduleRules.length === 0 ? (
            <UniversalCard className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-v3-secondary/50" />
              <h3 className="text-lg font-semibold text-v3-primary mb-2">
                No availability rules
              </h3>
              <p className="text-v3-secondary mb-4">
                Set up when you're available for bookings. Add weekly recurring hours or one-off overrides.
              </p>
              <UniversalButton variant="primary" onClick={() => setShowRuleModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </UniversalButton>
            </UniversalCard>
          ) : (
            <div className="space-y-3">
              {scheduleRules.map((rule) => (
                <UniversalCard key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {rule.name && (
                          <span className="font-medium text-v3-primary">{rule.name}</span>
                        )}
                        <span className={
                          'text-xs px-2 py-0.5 rounded-full font-medium ' +
                          (rule.is_available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600')
                        }>
                          {rule.is_available ? 'Open' : 'Closed'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-v3-accent/10 text-v3-accent font-medium">
                          {rule.rule_type}
                        </span>
                      </div>
                      <p className="text-sm text-v3-secondary mt-1">
                        {formatScheduleRule(rule)}
                        {rule.is_available && (
                          <> &middot; {rule.max_concurrent_appointments} concurrent</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <UniversalButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </UniversalButton>
                      <UniversalButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </UniversalButton>
                    </div>
                  </div>
                </UniversalCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={showServiceModal}
        onClose={handleCloseModal}
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
    </AppScaffold>
  );
}
