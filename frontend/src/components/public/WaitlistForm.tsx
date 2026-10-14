import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import UniversalButton from '../universal/UniversalButton';
import { useJoinWaitlist } from '../../hooks/useDrops';

const schema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(100),
  email: z.string().trim().email('Please enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  'w-full px-4 py-3 border-2 border-outline-variant rounded-xl bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

/**
 * Sign-up for a sold-out drop. Everyone on the list is emailed when a spot opens.
 */
export default function WaitlistForm({ dropId }: { dropId: number }) {
  const join = useJoinWaitlist();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const response = await join.mutateAsync({ dropId, ...values });
    if (response.success) {
      setJoined(true);
    } else {
      setError(response.message || 'Could not join the waitlist');
    }
  };

  if (joined) {
    return (
      <div className="p-6 rounded-xl bg-secondary-container text-on-secondary-container">
        <p className="font-bold">You're on the waitlist.</p>
        <p className="text-sm mt-1">If someone cancels, we'll email you right away — first to book gets the spot.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <p className="font-bold text-on-surface">Join the waitlist</p>
        <p className="text-sm text-on-surface-variant">Get an email the moment a spot opens up.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input placeholder="Name" autoComplete="name" className={inputClass} {...register('name')} />
          {formState.errors.name && <p className="text-error text-xs mt-1">{formState.errors.name.message}</p>}
        </div>
        <div>
          <input placeholder="Email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
          {formState.errors.email && <p className="text-error text-xs mt-1">{formState.errors.email.message}</p>}
        </div>
      </div>
      {error && <p className="text-error text-sm">{error}</p>}
      <UniversalButton type="submit" variant="primary" isLoading={join.isPending} className="w-full sm:w-auto">
        Notify me
      </UniversalButton>
    </form>
  );
}
