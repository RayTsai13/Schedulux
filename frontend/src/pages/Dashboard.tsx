import { useState } from 'react';
import { Calendar, Clock, Users, DollarSign, Plus, Bell, Settings, Store, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import ServiceManager from '../components/vendor/ServiceManager';
import HoursManager from '../components/vendor/HoursManager';
import StorefrontFormModal from '../components/vendor/StorefrontFormModal';
import { useStorefronts } from '../hooks/useStorefronts';
import { useUIStore } from '../stores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const Dashboard = () => {
  const [selectedView, setSelectedView] = useState<'overview' | 'appointments' | 'clients' | 'analytics' | 'settings'>('settings');
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<number | null>(null);
  const [settingsTab, setSettingsTab] = useState<'services' | 'hours'>('services');

  // Fetch storefronts for vendor setup
  const { data: storefronts, isLoading: storefrontsLoading } = useStorefronts();
  const { activeModal, openModal, closeModal } = useUIStore();

  // Auto-select first storefront when loaded
  if (storefronts && storefronts.length > 0 && !selectedStorefrontId) {
    setSelectedStorefrontId(storefronts[0].id);
  }

  // Get current date
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <span className="text-sm text-gray-500">{today}</span>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
              </button>

              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Appointment</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
          {[
            { key: 'overview', label: 'Overview', icon: Calendar },
            { key: 'appointments', label: 'Appointments', icon: Clock },
            { key: 'clients', label: 'Clients', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: DollarSign },
            { key: 'settings', label: 'Settings', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedView(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                selectedView === key
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Overview - Coming Soon */}
        {selectedView === 'overview' && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Overview Dashboard</h2>
            <p className="text-gray-600">Real-time stats and today's schedule coming soon...</p>
            <p className="text-sm text-gray-500 mt-2">Start by setting up your services in the Settings tab.</p>
          </div>
        )}

        {/* Appointments - Coming Soon */}
        {selectedView === 'appointments' && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Appointments</h2>
            <p className="text-gray-600">Appointment management coming soon...</p>
            <p className="text-sm text-gray-500 mt-2">Start by setting up your services and business hours in the Settings tab.</p>
          </div>
        )}

        {/* Clients - Coming Soon */}
        {selectedView === 'clients' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Client Management</h2>
            <p className="text-gray-600">Client management features coming soon...</p>
          </div>
        )}

        {/* Analytics - Coming Soon */}
        {selectedView === 'analytics' && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        )}

        {/* Settings View - REAL DATA */}
        {selectedView === 'settings' && (
          <div className="space-y-6">
            {/* Storefront Selector */}
            {storefrontsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : storefronts && storefronts.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Store className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Storefront:</span>
                    </div>
                    <Select
                      value={selectedStorefrontId?.toString() || ''}
                      onValueChange={(value) => setSelectedStorefrontId(parseInt(value, 10))}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select storefront" />
                      </SelectTrigger>
                      <SelectContent>
                        {storefronts.map((storefront) => (
                          <SelectItem key={storefront.id} value={storefront.id.toString()}>
                            {storefront.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Settings Sub-tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setSettingsTab('services')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        settingsTab === 'services'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Services
                    </button>
                    <button
                      onClick={() => setSettingsTab('hours')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        settingsTab === 'hours'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Business Hours
                    </button>
                  </nav>
                </div>

                {/* Settings Content */}
                {selectedStorefrontId && (
                  <>
                    {settingsTab === 'services' && (
                      <ServiceManager storefrontId={selectedStorefrontId} />
                    )}
                    {settingsTab === 'hours' && (
                      <HoursManager storefrontId={selectedStorefrontId} />
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Storefronts Yet</h2>
                <p className="text-gray-600 mb-4">Create a storefront first to manage services and hours.</p>
                <button
                  onClick={() => openModal('createStorefront')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Storefront</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Storefront Modal */}
        <StorefrontFormModal
          isOpen={activeModal === 'createStorefront'}
          onClose={closeModal}
        />
      </div>
    </div>
  );
};

export default Dashboard;
