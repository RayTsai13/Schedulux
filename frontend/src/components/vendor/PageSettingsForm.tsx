import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import UniversalButton from '../universal/UniversalButton';
import { useSlugAvailability } from '../../hooks/useStorefronts';
import type { CreateStorefrontRequest, Storefront } from '../../services/api';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_PATTERN, '3–30 lowercase letters, numbers, or dashes (no dash at the ends)'),
  description: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  timezone: z.string().min(1),
  instagram_handle: z
    .string()
    .trim()
    .regex(/^@?[A-Za-z0-9._]{1,30}$/, 'Not a valid Instagram username')
    .or(z.literal(''))
    .optional(),
});

type FormValues = z.infer<typeof schema>;

/** Suggest a handle from a display name: "The Midnight Barber" → "the-midnight-barber" */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

// Intl.supportedValuesOf is ES2022; the project's TS lib target predates it
const supportedValuesOf = (Intl as { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf;
const TIMEZONES: string[] = supportedValuesOf ? supportedValuesOf('timeZone') : ['UTC'];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

interface PageSettingsFormProps {
  /** Existing page when editing; omitted during onboarding */
  page?: Storefront;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (data: CreateStorefrontRequest) => void;
}

/**
 * Name, handle, and details for the vendor's public page. Shared by onboarding and settings.
 */
export default function PageSettingsForm({ page, submitLabel, isSubmitting, onSubmit }: PageSettingsFormProps) {
  const [slugTouched, setSlugTouched] = useState(!!page);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: page?.name ?? '',
      slug: page?.slug ?? '',
      description: page?.description ?? '',
      city: page?.city ?? '',
      state: page?.state ?? '',
      address: page?.address ?? '',
      timezone: page?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      instagram_handle: page?.instagram_handle ?? '',
    },
  });

  const name = watch('name');
  const slug = (watch('slug') || '').toLowerCase();

  // Suggest a handle from the name until the vendor edits it themselves
  useEffect(() => {
    if (!slugTouched) setValue('slug', slugify(name));
  }, [name, slugTouched, setValue]);

  const isOwnSlug = page?.slug === slug;
  const slugCheckable = SLUG_PATTERN.test(slug) && !isOwnSlug;
  const { data: slugAvailable, isFetching: checkingSlug } = useSlugAvailability(slugCheckable ? slug : '');
  const slugTaken = slugCheckable && slugAvailable === false;

  const submit = (values: FormValues) => {
    if (slugTaken) return;
    onSubmit({
      ...values,
      instagram_handle: values.instagram_handle ? values.instagram_handle.replace(/^@/, '') : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-2">
          Display name <span className="text-error">*</span>
        </label>
        <input id="name" className={inputClass} placeholder="e.g., The Midnight Barber" {...register('name')} />
        {errors.name && <p className="mt-1 text-sm text-error">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-on-surface mb-2">
          Your link <span className="text-error">*</span>
        </label>
        <div className="flex items-stretch rounded-xl border border-outline-variant bg-surface focus-within:ring-2 focus-within:ring-primary overflow-hidden">
          <span className="px-3 flex items-center text-sm text-on-surface-variant bg-surface-container-low whitespace-nowrap">
            {window.location.host}/@
          </span>
          <input
            id="slug"
            className="flex-1 min-w-0 px-3 py-3 bg-transparent text-on-surface focus:outline-none"
            placeholder="midnight-barber"
            {...register('slug', { onChange: () => setSlugTouched(true) })}
          />
        </div>
        {errors.slug ? (
          <p className="mt-1 text-sm text-error">{errors.slug.message}</p>
        ) : slugTaken ? (
          <p className="mt-1 text-sm text-error">That handle is taken.</p>
        ) : slugCheckable && !checkingSlug && slugAvailable ? (
          <p className="mt-1 text-sm text-on-secondary-container">Available!</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-2">
          Bio
        </label>
        <textarea
          id="description"
          rows={3}
          className={inputClass}
          placeholder="What you do, in a sentence or two"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-on-surface mb-2">City</label>
          <input id="city" className={inputClass} {...register('city')} />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-on-surface mb-2">State / region</label>
          <input id="state" className={inputClass} {...register('state')} />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-on-surface mb-2">Address (optional)</label>
        <input id="address" className={inputClass} placeholder="Shown on your page" {...register('address')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-on-surface mb-2">
            Timezone <span className="text-error">*</span>
          </label>
          <select id="timezone" className={inputClass} {...register('timezone')}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-on-surface-variant">Your hours and drops are in this timezone.</p>
        </div>
        <div>
          <label htmlFor="instagram_handle" className="block text-sm font-medium text-on-surface mb-2">Instagram</label>
          <input id="instagram_handle" className={inputClass} placeholder="@yourhandle" {...register('instagram_handle')} />
          {errors.instagram_handle && <p className="mt-1 text-sm text-error">{errors.instagram_handle.message}</p>}
        </div>
      </div>

      <UniversalButton type="submit" variant="primary" size="lg" isLoading={isSubmitting} disabled={slugTaken} className="w-full">
        {submitLabel}
      </UniversalButton>
    </form>
  );
}
