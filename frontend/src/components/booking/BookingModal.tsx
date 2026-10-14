import { useState, useEffect } from 'react';
import { z } from 'zod';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import { useCreateAppointment } from '../../hooks/useAppointments';
import type { PublicStorefront, PublicDrop, Service, AvailableSlot, Appointment } from '../../services/api';
import BookingStepService from './BookingStepService';
import BookingStepDateTime from './BookingStepDateTime';
import BookingStepConfirm, { type GuestDetails } from './BookingStepConfirm';
import BookingSuccess from './BookingSuccess';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  storefront: PublicStorefront;
  services: Service[];
  preSelectedServiceId?: number;
  /** Book into this drop: limits services to the drop's and times to its window */
  drop?: PublicDrop;
}

type BookingStep = 1 | 2 | 3 | 4;

const guestSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(100),
  email: z.string().trim().email('Please enter a valid email'),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\-.\s\d]{7,30}$/, 'Please enter a valid phone number')
    .or(z.literal('')),
});

type GuestErrors = Partial<Record<keyof GuestDetails, string>>;

function validateGuest(guest: GuestDetails): GuestErrors {
  const result = guestSchema.safeParse(guest);
  if (result.success) return {};
  const errors: GuestErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof GuestDetails;
    errors[key] ??= issue.message;
  }
  return errors;
}

interface BookingState {
  currentStep: BookingStep;
  selectedService: Service | null;
  selectedDate: Date | null;
  selectedSlot: AvailableSlot | null;
  guest: GuestDetails;
  showGuestErrors: boolean;
  clientNotes: string;
  isSubmitting: boolean;
  error: string | null;
  createdAppointment: Appointment | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  storefront,
  services,
  preSelectedServiceId,
  drop,
}: BookingModalProps) {
  const { mutateAsync: createAppointment } = useCreateAppointment();

  const bookableServices = drop?.service_id ? services.filter((s) => s.id === drop.service_id) : services;

  const initialState = (): BookingState => {
    const serviceId = preSelectedServiceId ?? (bookableServices.length === 1 ? bookableServices[0].id : undefined);
    const service = serviceId ? bookableServices.find((s) => s.id === serviceId) ?? null : null;
    return {
      currentStep: service ? 2 : 1,
      selectedService: service,
      selectedDate: null,
      selectedSlot: null,
      guest: { name: '', email: '', phone: '' },
      showGuestErrors: false,
      clientNotes: '',
      isSubmitting: false,
      error: null,
      createdAppointment: null,
    };
  };

  const [state, setState] = useState<BookingState>(initialState);

  // Start fresh each time the modal opens, using the current pre-selection
  useEffect(() => {
    if (isOpen) setState(initialState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const guestErrors = validateGuest(state.guest);

  const getStepTitle = (step: BookingStep): string => {
    switch (step) {
      case 1:
        return 'Select Service';
      case 2:
        return drop ? drop.title : 'Choose Date & Time';
      case 3:
        return 'Your Details';
      case 4:
        return 'Booking Requested';
      default:
        return 'Book Appointment';
    }
  };

  const canProceed = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return !!state.selectedService;
      case 2:
        return !!state.selectedSlot;
      case 3:
        return true; // validated on submit so errors only show after an attempt
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setState((prev) => ({ ...prev, currentStep: (prev.currentStep + 1) as BookingStep }));
    }
  };

  const handlePrevious = () => {
    if (state.currentStep > 1) {
      setState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as BookingStep,
        error: null,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!state.selectedService || !state.selectedSlot) {
      setState((prev) => ({ ...prev, error: 'Please select a service and time slot.' }));
      return;
    }

    if (Object.keys(guestErrors).length > 0) {
      setState((prev) => ({ ...prev, showGuestErrors: true }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await createAppointment({
        storefront_id: storefront.id,
        service_id: state.selectedService.id,
        start_datetime: state.selectedSlot.start_datetime,
        client_notes: state.clientNotes || undefined,
        drop_id: drop?.id ?? null,
        guest_name: state.guest.name.trim(),
        guest_email: state.guest.email.trim(),
        guest_phone: state.guest.phone.trim() || undefined,
      });

      if (response.success && response.data) {
        const created = response.data;
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          currentStep: 4,
          createdAppointment: created,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: response.message || 'Failed to book appointment. Please try again.',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: (error instanceof Error && error.message) || 'An unexpected error occurred. Please try again.',
      }));
    }
  };

  const renderProgressIndicator = () => {
    if (state.currentStep === 4) return null;

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              step === state.currentStep
                ? 'w-8 bg-primary'
                : step < state.currentStep
                ? 'w-2 bg-primary/50'
                : 'w-2 bg-outline-variant'
            }`}
            aria-current={step === state.currentStep ? 'step' : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getStepTitle(state.currentStep)} size="lg">
      {renderProgressIndicator()}

      <div className="min-h-[400px]">
        {state.currentStep === 1 && (
          <BookingStepService
            services={bookableServices}
            selectedServiceId={state.selectedService?.id || null}
            onSelectService={(service) => setState((prev) => ({ ...prev, selectedService: service }))}
          />
        )}

        {state.currentStep === 2 && state.selectedService && (
          <BookingStepDateTime
            storefrontId={storefront.id}
            serviceId={state.selectedService.id}
            selectedDate={state.selectedDate}
            selectedSlot={state.selectedSlot}
            onSelectDate={(date) => setState((prev) => ({ ...prev, selectedDate: date, selectedSlot: null }))}
            onSelectSlot={(slot) => setState((prev) => ({ ...prev, selectedSlot: slot }))}
            window={drop ? { date: drop.drop_date.slice(0, 10), start: drop.start_time, end: drop.end_time } : undefined}
          />
        )}

        {state.currentStep === 3 && state.selectedService && state.selectedSlot && (
          <BookingStepConfirm
            storefront={storefront}
            service={state.selectedService}
            selectedSlot={state.selectedSlot}
            guest={state.guest}
            guestErrors={state.showGuestErrors ? guestErrors : {}}
            clientNotes={state.clientNotes}
            onGuestChange={(guest) => setState((prev) => ({ ...prev, guest }))}
            onClientNotesChange={(notes) => setState((prev) => ({ ...prev, clientNotes: notes }))}
            error={state.error}
          />
        )}

        {state.currentStep === 4 && state.createdAppointment && (
          <BookingSuccess
            appointment={state.createdAppointment}
            storefrontName={storefront.name}
            serviceName={state.selectedService?.name || ''}
            timezone={storefront.timezone}
            onClose={onClose}
          />
        )}
      </div>

      {state.currentStep !== 4 && (
        <div className="flex justify-between mt-6 pt-4 border-t border-outline-variant">
          {state.currentStep > 1 && (
            <UniversalButton variant="outline" onClick={handlePrevious} disabled={state.isSubmitting}>
              Previous
            </UniversalButton>
          )}
          <UniversalButton
            variant="primary"
            onClick={state.currentStep === 3 ? handleSubmit : handleNext}
            disabled={!canProceed() || state.isSubmitting}
            isLoading={state.isSubmitting}
            className={state.currentStep === 1 ? 'ml-auto' : ''}
          >
            {state.currentStep === 3 ? 'Request Booking' : 'Next'}
          </UniversalButton>
        </div>
      )}
    </Modal>
  );
}
