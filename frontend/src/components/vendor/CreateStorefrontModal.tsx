import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateStorefront } from '../../hooks/useStorefronts';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import type { ProfileType, LocationType } from '../../services/api';

// Validation schema
const storefrontSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  profile_type: z.enum(['individual', 'business'] as const),
  location_type: z.enum(['fixed', 'mobile', 'hybrid'] as const),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  service_area_city: z.string().optional(),
  service_radius: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  timezone: z.string().optional(),
}).refine(
  (data) => {
    // If fixed location, require address and city/state
    if (data.location_type === 'fixed') {
      return !!data.address && !!data.city && !!data.state;
    }
    return true;
  },
  {
    message: 'Address, city, and state are required for fixed locations',
    path: ['address'],
  }
).refine(
  (data) => {
    // If mobile or hybrid, require service area and radius
    if (data.location_type === 'mobile' || data.location_type === 'hybrid') {
      return !!data.service_area_city && !!data.service_radius;
    }
    return true;
  },
  {
    message: 'Service area city and radius are required for mobile/hybrid services',
    path: ['service_area_city'],
  }
);

type StorefrontFormData = z.infer<typeof storefrontSchema>;

interface CreateStorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateStorefrontModal({ isOpen, onClose }: CreateStorefrontModalProps) {
  const navigate = useNavigate();
  const createStorefront = useCreateStorefront();

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<StorefrontFormData>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      profile_type: 'business',
      location_type: 'fixed',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const locationType = watch('location_type');
  const isFixed = locationType === 'fixed';
  const isMobileOrHybrid = locationType === 'mobile' || locationType === 'hybrid';

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: StorefrontFormData) => {
    try {
      const response = await createStorefront.mutateAsync(data);
      if (response.success && response.data) {
        onClose();
        // Navigate to the newly created storefront
        navigate(`/dashboard/storefront/${response.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create storefront:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Storefront"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-v3-primary">Basic Information</h3>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-v3-primary mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
              placeholder="e.g., The Midnight Barber"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-v3-primary mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
              placeholder="Tell customers about your business..."
            />
          </div>
        </div>

        {/* Profile Type */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-3">
            Profile Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative">
              <input
                type="radio"
                value="individual"
                {...register('profile_type')}
                className="peer sr-only"
              />
              <div className="px-4 py-3 rounded-xl border-2 border-v3-border bg-v3-background cursor-pointer peer-checked:border-v3-accent peer-checked:bg-v3-accent/5 transition-all">
                <p className="font-medium text-v3-primary">Individual</p>
                <p className="text-xs text-v3-secondary mt-1">Freelancer, tutor, etc.</p>
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                value="business"
                {...register('profile_type')}
                className="peer sr-only"
              />
              <div className="px-4 py-3 rounded-xl border-2 border-v3-border bg-v3-background cursor-pointer peer-checked:border-v3-accent peer-checked:bg-v3-accent/5 transition-all">
                <p className="font-medium text-v3-primary">Business</p>
                <p className="text-xs text-v3-secondary mt-1">Salon, clinic, shop, etc.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Location Type */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-3">
            Location Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="relative">
              <input
                type="radio"
                value="fixed"
                {...register('location_type')}
                className="peer sr-only"
              />
              <div className="px-3 py-3 rounded-xl border-2 border-v3-border bg-v3-background cursor-pointer peer-checked:border-v3-accent peer-checked:bg-v3-accent/5 transition-all text-center">
                <p className="font-medium text-v3-primary text-sm">Fixed</p>
                <p className="text-xs text-v3-secondary mt-1">At location</p>
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                value="mobile"
                {...register('location_type')}
                className="peer sr-only"
              />
              <div className="px-3 py-3 rounded-xl border-2 border-v3-border bg-v3-background cursor-pointer peer-checked:border-v3-accent peer-checked:bg-v3-accent/5 transition-all text-center">
                <p className="font-medium text-v3-primary text-sm">Mobile</p>
                <p className="text-xs text-v3-secondary mt-1">Travel to client</p>
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                value="hybrid"
                {...register('location_type')}
                className="peer sr-only"
              />
              <div className="px-3 py-3 rounded-xl border-2 border-v3-border bg-v3-background cursor-pointer peer-checked:border-v3-accent peer-checked:bg-v3-accent/5 transition-all text-center">
                <p className="font-medium text-v3-primary text-sm">Hybrid</p>
                <p className="text-xs text-v3-secondary mt-1">Both options</p>
              </div>
            </label>
          </div>
        </div>

        {/* Fixed Location Fields */}
        {isFixed && (
          <div className="space-y-4 p-4 rounded-xl bg-v3-accent/5 border border-v3-accent/20">
            <h4 className="text-sm font-semibold text-v3-primary">Fixed Location Details</h4>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-v3-primary mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                {...register('address')}
                className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                placeholder="123 Main St"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-v3-primary mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city')}
                  className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-v3-primary mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  {...register('state')}
                  className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                  placeholder="CA"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile/Hybrid Service Fields */}
        {isMobileOrHybrid && (
          <div className="space-y-4 p-4 rounded-xl bg-v3-accent/5 border border-v3-accent/20">
            <h4 className="text-sm font-semibold text-v3-primary">Service Area Details</h4>

            <div>
              <label htmlFor="service_area_city" className="block text-sm font-medium text-v3-primary mb-2">
                Service Area City <span className="text-red-500">*</span>
              </label>
              <input
                id="service_area_city"
                type="text"
                {...register('service_area_city')}
                className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                placeholder="San Francisco"
              />
              {errors.service_area_city && (
                <p className="mt-1 text-sm text-red-500">{errors.service_area_city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="service_radius" className="block text-sm font-medium text-v3-primary mb-2">
                Service Radius (miles) <span className="text-red-500">*</span>
              </label>
              <Controller
                name="service_radius"
                control={control}
                render={({ field }) => (
                  <input
                    id="service_radius"
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                    placeholder="15"
                  />
                )}
              />
              {errors.service_radius && (
                <p className="mt-1 text-sm text-red-500">{errors.service_radius.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-v3-primary">Contact Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-v3-primary mb-2">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-v3-primary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                placeholder="contact@business.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-v3-primary mb-2">
            Timezone
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Anchorage">Alaska Time</option>
            <option value="Pacific/Honolulu">Hawaii Time</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <UniversalButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createStorefront.isPending}
          >
            Cancel
          </UniversalButton>
          <UniversalButton
            type="submit"
            variant="primary"
            isLoading={createStorefront.isPending}
            disabled={createStorefront.isPending}
            className="flex-1"
          >
            {createStorefront.isPending ? 'Creating...' : 'Create Storefront'}
          </UniversalButton>
        </div>
      </form>
    </Modal>
  );
}
