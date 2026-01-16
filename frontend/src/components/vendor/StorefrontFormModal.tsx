import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import TimezoneSelector from './TimezoneSelector';
import BusinessHoursEditor from './BusinessHoursEditor';
import { useCreateStorefront, useUpdateStorefront } from '../../hooks/useStorefronts';
import type { Storefront, BusinessHours, ProfileType, LocationType } from '../../services/api';

// Validation schema
const storefrontSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
  business_hours: z.record(z.string(), z.object({
    isOpen: z.boolean(),
    periods: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
  })).optional(),
  is_active: z.boolean().optional(),
  // Marketplace fields
  profile_type: z.enum(['individual', 'business']).default('business'),
  location_type: z.enum(['fixed', 'mobile', 'hybrid']).default('fixed'),
  service_radius: z.number().min(1).max(100).optional().nullable(),
  service_area_city: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

type StorefrontFormData = z.infer<typeof storefrontSchema>;

interface StorefrontFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  storefront?: Storefront; // If provided, we're editing
}

const StorefrontFormModal = ({ isOpen, onClose, storefront }: StorefrontFormModalProps) => {
  console.log('🔵 StorefrontFormModal render - isOpen:', isOpen);

  const isEditMode = !!storefront;
  const createStorefront = useCreateStorefront();
  const updateStorefront = useUpdateStorefront();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<StorefrontFormData>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      timezone: 'UTC',
      business_hours: undefined,
      is_active: true,
      // Marketplace fields
      profile_type: 'business' as ProfileType,
      location_type: 'fixed' as LocationType,
      service_radius: null,
      service_area_city: '',
      avatar_url: '',
    },
  });

  // Watch timezone and business hours for controlled components
  const timezone = watch('timezone');
  const businessHours = watch('business_hours');
  const locationType = watch('location_type');

  // Pre-populate form when editing
  useEffect(() => {
    if (isEditMode && storefront) {
      reset({
        name: storefront.name,
        description: storefront.description || '',
        address: storefront.address || '',
        phone: storefront.phone || '',
        email: storefront.email || '',
        timezone: storefront.timezone,
        business_hours: storefront.business_hours,
        is_active: storefront.is_active,
        // Marketplace fields
        profile_type: storefront.profile_type || 'business',
        location_type: storefront.location_type || 'fixed',
        service_radius: storefront.service_radius || null,
        service_area_city: storefront.service_area_city || '',
        avatar_url: storefront.avatar_url || '',
      });
    } else if (!isEditMode) {
      // Reset to defaults for create mode
      reset({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        timezone: 'UTC',
        business_hours: undefined,
        is_active: true,
        // Marketplace fields
        profile_type: 'business',
        location_type: 'fixed',
        service_radius: null,
        service_area_city: '',
        avatar_url: '',
      });
    }
  }, [isEditMode, storefront, reset]);

  const onSubmit = async (data: StorefrontFormData) => {
    try {
      const submissionData = {
        ...data,
        email: data.email || undefined,
        description: data.description || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        avatar_url: data.avatar_url || undefined,
        service_area_city: data.service_area_city || undefined,
        service_radius: data.service_radius || undefined,
      };

      if (isEditMode && storefront) {
        // Update existing storefront
        await updateStorefront.mutateAsync({
          id: storefront.id,
          data: submissionData,
        });
      } else {
        // Create new storefront
        await createStorefront.mutateAsync(submissionData);
      }

      // Close modal on success (mutations handle toast notifications)
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error);
    }
  };

  const isLoading = createStorefront.isPending || updateStorefront.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Storefront' : 'Create New Storefront'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Storefront Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
            }`}
            placeholder="e.g., Downtown Salon"
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.description
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
            }`}
            placeholder="Brief description of this location..."
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Marketplace Settings */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 space-y-4">
          <h3 className="text-sm font-semibold text-purple-900">Marketplace Settings</h3>

          {/* Profile Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="business"
                  {...register('profile_type')}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Business (Salon, Clinic, Studio)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="individual"
                  {...register('profile_type')}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Individual (Tutor, Freelancer)</span>
              </label>
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Location
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="fixed"
                  {...register('location_type')}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Fixed Location</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="mobile"
                  {...register('location_type')}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Mobile (I travel to clients)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="hybrid"
                  {...register('location_type')}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Hybrid (Both)</span>
              </label>
            </div>
          </div>

          {/* Mobile/Hybrid Settings */}
          {(locationType === 'mobile' || locationType === 'hybrid') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-purple-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service Area City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('service_area_city')}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                  placeholder="e.g., San Francisco, CA"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Displayed as "Serves within X miles of [City]"
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service Radius (miles) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('service_radius', { valueAsNumber: true })}
                  min={1}
                  max={100}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:border-purple-500 focus:ring-purple-200"
                  placeholder="15"
                />
              </div>
            </div>
          )}

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Profile Image URL
            </label>
            <input
              type="url"
              {...register('avatar_url')}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:border-purple-500 focus:ring-purple-200"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional profile image or logo
            </p>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Address
          </label>
          <input
            type="text"
            {...register('address')}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.address
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
            }`}
            placeholder="123 Main St, City, State 12345"
          />
          {errors.address && (
            <p className="mt-1.5 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        {/* Contact Info - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              {...register('phone')}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.phone
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
              }`}
              placeholder="(555) 123-4567"
            />
            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
              }`}
              placeholder="contact@example.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Timezone Selector */}
        <TimezoneSelector
          value={timezone}
          onChange={(tz) => setValue('timezone', tz)}
          error={errors.timezone?.message}
        />

        {/* Business Hours Editor */}
        <BusinessHoursEditor
          value={businessHours}
          onChange={(hours) => setValue('business_hours', hours)}
        />

        {/* Active Status Toggle */}
        {isEditMode && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Storefront Status
              </label>
              <p className="text-sm text-gray-500 mt-0.5">
                Active storefronts are visible to clients for booking
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValue('is_active', !watch('is_active'))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                watch('is_active') ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  watch('is_active') ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isEditMode ? 'Update Storefront' : 'Create Storefront'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StorefrontFormModal;
