import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateService, useUpdateService } from '../../hooks/useServices';
import { uploadApi } from '../../services/api';
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
  image_url: z.string().url().nullish().or(z.literal('')),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
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
          image_url: service.image_url || '',
        }
      : {
          duration_minutes: 60,
          buffer_time_minutes: 0,
          image_url: '',
        },
  });

  const currentImageUrl = watch('image_url');

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
        image_url: service.image_url || '',
      });
      setImagePreview(service.image_url || null);
    } else if (!isOpen) {
      reset({
        name: '',
        description: '',
        duration_minutes: 60,
        buffer_time_minutes: 0,
        price: undefined,
        category: '',
        image_url: '',
      });
      setImagePreview(null);
      setUploadError(null);
    }
  }, [isOpen, service, reset]);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be under 5MB');
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setIsUploading(true);

    try {
      const result = await uploadApi.uploadImage(file);
      if (result.success && result.data) {
        setValue('image_url', result.data.url, { shouldDirty: true });
        setImagePreview(result.data.url);
      } else {
        setUploadError(result.message || 'Upload failed');
        setImagePreview(currentImageUrl || null);
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
      setImagePreview(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  }, [setValue, currentImageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setValue('image_url', '', { shouldDirty: true });
    setImagePreview(null);
    setUploadError(null);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const payload = {
        ...data,
        image_url: data.image_url || undefined,
      };

      if (isEditing) {
        await updateService.mutateAsync({
          id: service.id,
          data: {
            ...payload,
            // Send null explicitly to clear image
            image_url: data.image_url || null,
          },
        });
      } else {
        await createService.mutateAsync({
          storefrontId,
          data: payload,
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
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">
            Service Image
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
              isDragOver
                ? 'border-v3-accent bg-v3-accent/5'
                : 'border-v3-border hover:border-v3-accent/50'
            }`}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Service preview"
                  className="w-full h-full object-cover"
                />
                {/* Upload spinner overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {/* Remove button */}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-sm transition-colors"
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-v3-secondary/60">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p className="text-sm font-medium">Click or drag to upload</p>
                <p className="text-xs mt-1">JPEG, PNG, WebP up to 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadError && (
            <p className="mt-1 text-sm text-red-500">{uploadError}</p>
          )}
        </div>

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
            disabled={isLoading || isUploading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Service' : 'Add Service'}
          </UniversalButton>
        </div>
      </form>
    </Modal>
  );
}
