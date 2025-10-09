import { Store, Plus, Edit2, Trash2, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';
import { useStorefronts, useDeleteStorefront } from '../../hooks/useStorefronts';
import { useUIStore } from '../../stores';
import StorefrontFormModal from '../../components/vendor/StorefrontFormModal';
import type { Storefront } from '../../services/api';

/**
 * Storefront Management Page
 *
 * Allows vendors to view, create, edit, and manage their business locations.
 * Each storefront represents a physical location where services are offered.
 */

const StorefrontManagement = () => {
  const { data: storefronts, isLoading, error } = useStorefronts();
  const { activeModal, modalData, openModal, closeModal } = useUIStore();
  const deleteStorefront = useDeleteStorefront();

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      await deleteStorefront.mutateAsync(id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your storefronts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Storefronts</h2>
          <p className="text-gray-600 mb-4">{(error as Error).message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!storefronts || storefronts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Storefronts</h1>
              <p className="text-gray-600 mt-1">Manage your business locations</p>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">No storefronts yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first storefront. A storefront represents a physical location
              where you provide services to your clients.
            </p>
            <button
              onClick={() => {
                console.log('Button clicked! Opening modal...');
                console.log('Current activeModal:', activeModal);
                openModal('createStorefront');
                console.log('After openModal, activeModal should be:', 'createStorefront');
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Storefront</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals - Also needed in empty state */}
      <StorefrontFormModal
        isOpen={activeModal === 'createStorefront'}
        onClose={closeModal}
      />

      <StorefrontFormModal
        isOpen={activeModal === 'editStorefront'}
        onClose={closeModal}
        storefront={modalData as Storefront}
      />
    </div>
    );
  }

  // Main view with storefronts
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Storefronts</h1>
            <p className="text-gray-600 mt-1">
              {storefronts.length} {storefronts.length === 1 ? 'location' : 'locations'}
            </p>
          </div>
          <button
            onClick={() => openModal('createStorefront')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 inline-flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Storefront</span>
          </button>
        </div>

        {/* Storefronts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storefronts.map((storefront) => (
            <StorefrontCard
              key={storefront.id}
              storefront={storefront}
              onEdit={() => openModal('editStorefront', storefront)}
              onDelete={() => handleDelete(storefront.id, storefront.name)}
              isDeleting={deleteStorefront.isPending}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <StorefrontFormModal
        isOpen={activeModal === 'createStorefront'}
        onClose={closeModal}
      />

      <StorefrontFormModal
        isOpen={activeModal === 'editStorefront'}
        onClose={closeModal}
        storefront={modalData as Storefront}
      />
    </div>
  );
};

// Storefront Card Component
interface StorefrontCardProps {
  storefront: Storefront;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const StorefrontCard = ({ storefront, onEdit, onDelete, isDeleting }: StorefrontCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{storefront.name}</h3>
              {storefront.is_active ? (
                <span className="inline-flex items-center text-xs text-green-100 mt-1">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-1.5"></span>
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center text-xs text-gray-300 mt-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        {storefront.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{storefront.description}</p>
        )}

        <div className="space-y-2">
          {storefront.address && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span className="line-clamp-1">{storefront.address}</span>
            </div>
          )}

          {storefront.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{storefront.phone}</span>
            </div>
          )}

          {storefront.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="line-clamp-1">{storefront.email}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <Globe className="w-4 h-4 mr-2 text-gray-400" />
            <span>{storefront.timezone}</span>
          </div>

          {storefront.business_hours && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span>Business hours configured</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 p-4 flex items-center justify-end space-x-2 bg-gray-50">
        <button
          onClick={onEdit}
          className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default StorefrontManagement;
