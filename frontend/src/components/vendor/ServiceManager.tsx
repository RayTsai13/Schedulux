import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from '../../hooks/useServices';
import type { Service, CreateServiceRequest, UpdateServiceRequest } from '../../services/api';

interface ServiceManagerProps {
  storefrontId: number;
}

interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  buffer_time_minutes: number;
  price: string;
  category: string;
}

const initialFormData: ServiceFormData = {
  name: '',
  description: '',
  duration_minutes: 30,
  buffer_time_minutes: 0,
  price: '',
  category: '',
};

export default function ServiceManager({ storefrontId }: ServiceManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Queries and mutations
  const { data: services, isLoading, error } = useServices(storefrontId);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(storefrontId);
  const deleteMutation = useDeleteService(storefrontId);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      buffer_time_minutes: service.buffer_time_minutes,
      price: service.price?.toString() || '',
      category: service.category || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateServiceRequest | UpdateServiceRequest = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      duration_minutes: formData.duration_minutes,
      buffer_time_minutes: formData.buffer_time_minutes,
      price: formData.price ? parseFloat(formData.price) : undefined,
      category: formData.category.trim() || undefined,
    };

    if (editingService) {
      await updateMutation.mutateAsync({ id: editingService.id, data });
    } else {
      await createMutation.mutateAsync({ storefrontId, data: data as CreateServiceRequest });
    }

    closeModal();
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return `$${price.toFixed(2)}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load services. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Services</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage the services you offer to your customers
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services Table */}
      {services && services.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {service.description}
                        </div>
                      )}
                      {service.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                          {service.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDuration(service.duration_minutes)}
                    </div>
                    {service.buffer_time_minutes > 0 && (
                      <div className="text-xs text-gray-500">
                        +{service.buffer_time_minutes}min buffer
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                      {formatPrice(service.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === service.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                            disabled={deleteMutation.isPending}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(service.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-500 mb-4">
            Add your first service to start accepting bookings
          </p>
          <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
            Add Your First Service
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Haircut & Style"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this service includes..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={480}
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 30 })
                }
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="buffer">Buffer Time (minutes)</Label>
              <Input
                id="buffer"
                type="number"
                min={0}
                max={120}
                value={formData.buffer_time_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    buffer_time_minutes: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Time between appointments</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min={0}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Hair, Nails"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingService ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
