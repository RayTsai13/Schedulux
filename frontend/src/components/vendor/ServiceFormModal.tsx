import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateService, useUpdateService } from '../../hooks/useServices';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import type { Service } from '../../services/api';

// Validation schema
const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  buffer_time_minutes: z.coerce.number().min(0, 'Buffer time cannot be negative').optional(),
  price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Price cannot be negative').optional()
  ),
  category: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  storefrontId: number;
  service?: Service | null;
}

export default function ServiceFormModal({
  isOpen,
  onClose,
  storefrontId,
  service,
}: ServiceFormModalProps) {
  const createService = useCreateService();
  const updateService = useUpdateService(storefrontId);

  const isEditing = !!service;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description || '',
          duration_minutes: service.duration_minutes,
          buffer_time_minutes: service.buffer_time_minutes || 0,
          price: service.price || undefined,
          category: service.category || '',
        }
      : {
          duration_minutes: 60,
          buffer_time_minutes: 0,
        },
  });

  // Reset form when service changes or modal closes
  useEffect(() => {
    if (isOpen && service) {
      reset({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        buffer_time_minutes: service.buffer_time_minutes || 0,
        price: service.price || undefined,
        category: service.category || '',
      });
    } else if (!isOpen) {
      reset({
        name: '',
        description: '',
        duration_minutes: 60,
        buffer_time_minutes: 0,
        price: undefined,
        category: '',
      });
    }
  }, [isOpen, service, reset]);

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (isEditing) {
        await updateService.mutateAsync({
          id: service.id,
          data,
        });
      } else {
        await createService.mutateAsync({
          storefrontId,
          data,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const isLoading = createService.isPending || updateService.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Service' : 'Add Service'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-v3-primary mb-2">
            Service Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
            placeholder="e.g., Classic Fade"
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
            placeholder="Describe what's included..."
          />
        </div>

        {/* Duration & Buffer */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-v3-primary mb-2">
              Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <Controller
              name="duration_minutes"
              control={control}
              render={({ field }) => (
                <input
                  id="duration_minutes"
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                  placeholder="60"
                />
              )}
            />
            {errors.duration_minutes && (
              <p className="mt-1 text-sm text-red-500">{errors.duration_minutes.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="buffer_time_minutes" className="block text-sm font-medium text-v3-primary mb-2">
              Buffer Time (minutes)
            </label>
            <Controller
              name="buffer_time_minutes"
              control={control}
              render={({ field }) => (
                <input
                  id="buffer_time_minutes"
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                  placeholder="0"
                />
              )}
            />
            {errors.buffer_time_minutes && (
              <p className="mt-1 text-sm text-red-500">{errors.buffer_time_minutes.message}</p>
            )}
          </div>
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-v3-primary mb-2">
              Price ($)
            </label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? e.target.valueAsNumber : undefined)}
                  value={field.value ?? ''}
                  className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                  placeholder="75.00"
                />
              )}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-v3-primary mb-2">
              Category
            </label>
            <input
              id="category"
              type="text"
              {...register('category')}
              className="w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
              placeholder="Haircut"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <UniversalButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </UniversalButton>
          <UniversalButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Service' : 'Add Service'}
          </UniversalButton>
        </div>
      </form>
    </Modal>
  );
}
