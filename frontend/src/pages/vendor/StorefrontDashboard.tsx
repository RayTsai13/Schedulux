import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Settings,
  Clock,
  Store,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

import { useStorefront } from '../../hooks/useStorefronts';
import { useUIStore } from '../../stores';
import Header from '../../components/Header';
import CalendarView from '../../components/vendor/CalendarView';
import ServiceManager from '../../components/vendor/ServiceManager';
import HoursManager from '../../components/vendor/HoursManager';
import AppointmentDetailModal from '../../components/vendor/AppointmentDetailModal';
import type { Appointment } from '../../services/api';

/**
 * StorefrontDashboard - Main management hub for a single storefront
 *
 * Provides tabbed interface for:
 * - Calendar: View and manage appointments
 * - Services: Manage services offered
 * - Schedule: Manage availability rules
 */

type TabId = 'calendar' | 'services' | 'schedule';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'services', label: 'Services', icon: Settings },
  { id: 'schedule', label: 'Schedule', icon: Clock },
];

const StorefrontDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storefrontId = id ? parseInt(id, 10) : null;

  const { data: storefront, isLoading, error } = useStorefront(storefrontId);
  const { activeModal, modalData, openModal, closeModal } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabId>('calendar');

  // Handle appointment selection from calendar
  const handleSelectAppointment = useCallback(
    (appointment: Appointment) => {
      openModal('appointmentDetail', appointment);
    },
    [openModal]
  );

  // Handle slot selection for creating new appointments
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      console.log('Create appointment at:', slotInfo);
      // TODO: Open create appointment modal
    },
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading storefront...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !storefront) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Storefront Not Found</h2>
            <p className="text-gray-600 mb-4">
              {(error as Error)?.message || 'The storefront you are looking for does not exist.'}
            </p>
            <Link
              to="/vendor/storefronts"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefronts</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Storefront Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Actions */}
          <div className="py-4">
            <button
              onClick={() => navigate('/vendor/storefronts')}
              className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center space-x-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefronts</span>
            </button>

            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{storefront.name}</h1>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    {storefront.address && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{storefront.address}</span>
                      </span>
                    )}
                    {storefront.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{storefront.phone}</span>
                      </span>
                    )}
                    {storefront.email && (
                      <span className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{storefront.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {storefront.is_active ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-3 text-sm font-medium rounded-t-lg transition-colors
                    flex items-center space-x-2
                    ${
                      isActive
                        ? 'bg-gray-50 text-purple-600 border-t-2 border-l border-r border-purple-600 border-gray-200 -mb-px'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CalendarView
              storefrontId={storefront.id}
              onSelectEvent={handleSelectAppointment}
              onSelectSlot={handleSelectSlot}
            />
          </div>
        )}

        {activeTab === 'services' && <ServiceManager storefrontId={storefront.id} />}

        {activeTab === 'schedule' && <HoursManager storefrontId={storefront.id} />}
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        isOpen={activeModal === 'appointmentDetail'}
        onClose={closeModal}
        appointment={modalData as Appointment | null}
      />
    </div>
  );
};

export default StorefrontDashboard;
