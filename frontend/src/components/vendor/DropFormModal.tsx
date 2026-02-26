import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDrop, useUpdateDrop, useDeleteDrop } from '../../hooks/useDrops';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import type { Drop, Service } from '../../services/api';

const dropSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().optional(),
  drop_date: z.string().min(1, 'Date is required'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  service_id: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().min(1).nullable().optional()
  ),
  max_concurrent_appointments: z.coerce.number().min(1, 'Must be at least 1'),
  is_published: z.boolean(),
}).refine(
  (d) => {
    const [sh, sm] = d.start_time.split(':').map(Number);
    const [eh, em] = d.end_time.split(':').map(Number);
    return sh * 60 + sm < eh * 60 + em;
  },
  { message: 'End time must be after start time', path: ['end_time'] }
);

type DropFormData = z.infer<typeof dropSchema>;

interface DropFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  storefrontId: number;
  drop?: Drop | null;
  services?: Service[];
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary ' +
  'placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent';

const selectClass =
  'w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary ' +
  'focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent';

function buildDefaultValues(drop?: Drop | null): DropFormData {
  if (drop) {
    return {
      title: drop.title,
      description: drop.description || '',
      drop_date: typeof drop.drop_date === 'string'
        ? drop.drop_date.substring(0, 10)
        : new Date(drop.drop_date).toISOString().substring(0, 10),
      start_time: drop.start_time.substring(0, 5),
      end_time: drop.end_time.substring(0, 5),
      service_id: drop.service_id,
      max_concurrent_appointments: drop.max_concurrent_appointments,
      is_published: drop.is_published,
    };
  }
  return {
    title: '',
    description: '',
    drop_date: '',
    start_time: '10:00',
    end_time: '18:00',
    service_id: null,
    max_concurrent_appointments: 1,
    is_published: false,
  };
}

export default function DropFormModal({
  isOpen,
  onClose,
  storefrontId,
  drop,
  services,
}: DropFormModalProps) {
  const isEditing = !!drop;

  const createDrop = useCreateDrop();
  const updateDrop = useUpdateDrop(storefrontId);
  const deleteDrop = useDeleteDrop(storefrontId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DropFormData>({
    resolver: zodResolver(dropSchema),
    defaultValues: buildDefaultValues(drop),
  });

  const isPublished = useWatch({ control, name: 'is_published' });

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaultValues(drop));
    }
  }, [isOpen, drop, reset]);

  const onSubmit = async (data: DropFormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        drop_date: data.drop_date,
        start_time: data.start_time,
        end_time: data.end_time,
        service_id: data.service_id ?? undefined,
        max_concurrent_appointments: data.max_concurrent_appointments,
        is_published: data.is_published,
      };

      if (isEditing) {
        await updateDrop.mutateAsync({ id: drop.id, data: payload });
      } else {
        await createDrop.mutateAsync({ storefrontId, data: payload });
      }
      onClose();
    } catch {
      // errors surfaced via toast in the hooks
    }
  };

  const handleDelete = async () => {
    if (!drop) return;
    if (!confirm('Delete this drop?')) return;
    await deleteDrop.mutateAsync(drop.id);
    onClose();
  };

  const isLoading = createDrop.isPending || updateDrop.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Drop' : 'Create Drop'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g., Friday Night Session"
            className={inputClass}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input type="date" {...register('drop_date')} className={inputClass} />
          {errors.drop_date && (
            <p className="mt-1 text-sm text-red-500">{errors.drop_date.message}</p>
          )}
        </div>

        {/* Time range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input type="time" {...register('start_time')} className={inputClass} />
            {errors.start_time && (
              <p className="mt-1 text-sm text-red-500">{errors.start_time.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              End Time <span className="text-red-500">*</span>
            </label>
            <input type="time" {...register('end_time')} className={inputClass} />
            {errors.end_time && (
              <p className="mt-1 text-sm text-red-500">{errors.end_time.message}</p>
            )}
          </div>
        </div>

        {/* Service (optional) */}
        {services && services.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              Service (optional)
            </label>
            <Controller
              name="service_id"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  className={selectClass}
                >
                  <option value="">All services</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            />
            <p className="mt-1 text-xs text-v3-secondary">
              Leave blank to allow booking any service during this drop.
            </p>
          </div>
        )}

        {/* Max concurrent */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">
            Max Simultaneous Bookings
          </label>
          <Controller
            name="max_concurrent_appointments"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={1}
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                className={inputClass}
              />
            )}
          />
          {errors.max_concurrent_appointments && (
            <p className="mt-1 text-sm text-red-500">{errors.max_concurrent_appointments.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">
            Description (optional)
          </label>
          <textarea
            {...register('description')}
            placeholder="Tell clients what this drop is about..."
            rows={3}
            className={inputClass}
          />
        </div>

        {/* Published toggle */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">Visibility</label>
          <Controller
            name="is_published"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={
                    'py-2 px-4 rounded-xl border-2 text-sm font-medium transition-all ' +
                    (!field.value
                      ? 'border-v3-accent bg-v3-accent/10 text-v3-accent'
                      : 'border-v3-border text-v3-secondary hover:border-v3-accent/50')
                  }
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={
                    'py-2 px-4 rounded-xl border-2 text-sm font-medium transition-all ' +
                    (field.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-v3-border text-v3-secondary hover:border-green-300')
                  }
                >
                  Published
                </button>
              </div>
            )}
          />
          <p className="mt-1 text-xs text-v3-secondary">
            {isPublished
              ? 'This drop is visible to clients and available for booking.'
              : 'Draft drops are only visible to you. Publish when ready.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {isEditing && (
            <UniversalButton
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteDrop.isPending}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Delete
            </UniversalButton>
          )}
          <div className="flex-1" />
          <UniversalButton type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </UniversalButton>
          <UniversalButton type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Drop'}
          </UniversalButton>
        </div>
      </form>
    </Modal>
  );
}
