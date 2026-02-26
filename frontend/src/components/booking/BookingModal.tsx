import { useState } from 'react';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import { useAuth } from '../../hooks/useAuth';
import { useCreateAppointment } from '../../hooks/useAppointments';
import type { PublicStorefrontDetail, AvailableSlot, ServiceLocationType } from '../../services/api';
import BookingStepService from './BookingStepService';
import BookingStepDateTime from './BookingStepDateTime';
import BookingStepConfirm from './BookingStepConfirm';
import BookingSuccess from './BookingSuccess';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  storefront: PublicStorefrontDetail['storefront'];
  services: PublicStorefrontDetail['services'];
  preSelectedServiceId?: number;
  preSelectedDropId?: number;
  dropServiceId?: number | null;
}

type BookingStep = 1 | 2 | 3 | 4;

interface BookingState {
  currentStep: BookingStep;
  selectedService: PublicStorefrontDetail['services'][0] | null;
  selectedDate: Date | null;
  selectedSlot: AvailableSlot | null;
  locationType: ServiceLocationType;
  clientAddress: string;
  clientNotes: string;
  isSubmitting: boolean;
  error: string | null;
  createdAppointment: any | null;
  dropId: number | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  storefront,
  services,
  preSelectedServiceId,
  preSelectedDropId,
  dropServiceId,
}: BookingModalProps) {
  const { isAuthenticated } = useAuth();
  const { mutateAsync: createAppointment } = useCreateAppointment();

  // Initialize booking state
  const [state, setState] = useState<BookingState>({
    currentStep: preSelectedServiceId ? 2 : 1,
    selectedService: preSelectedServiceId
      ? services.find(s => s.id === preSelectedServiceId) || null
      : null,
    selectedDate: null,
    selectedSlot: null,
    locationType: 'at_vendor',
    clientAddress: '',
    clientNotes: '',
    isSubmitting: false,
    error: null,
    createdAppointment: null,
    dropId: preSelectedDropId ?? null,
  });

  // Reset state when modal closes
  const handleClose = () => {
    setState({
      currentStep: preSelectedServiceId ? 2 : 1,
      selectedService: preSelectedServiceId
        ? services.find(s => s.id === preSelectedServiceId) || null
        : null,
      selectedDate: null,
      selectedSlot: null,
      locationType: 'at_vendor',
      clientAddress: '',
      clientNotes: '',
      isSubmitting: false,
      error: null,
      createdAppointment: null,
      dropId: preSelectedDropId ?? null,
    });
    onClose();
  };

  // Get step title
  const getStepTitle = (step: BookingStep): string => {
    switch (step) {
      case 1:
        return 'Select Service';
      case 2:
        return 'Choose Date & Time';
      case 3:
        return 'Confirm Booking';
      case 4:
        return 'Booking Confirmed!';
      default:
        return 'Book Appointment';
    }
  };

  // Check if user can proceed to next step
  const canProceed = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return !!state.selectedService;
      case 2:
        return !!state.selectedDate && !!state.selectedSlot;
      case 3:
        // If at_client, address is required
        if (state.locationType === 'at_client') {
          return state.clientAddress.trim().length > 0;
        }
        return true;
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = () => {
    if (canProceed()) {
      setState(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as BookingStep }));
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as BookingStep,
        error: null,
      }));
    }
  };

  // Submit booking
  const handleSubmit = async () => {
    // Check authentication
    if (!isAuthenticated) {
      // Save booking state to sessionStorage for future implementation
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        storefrontId: storefront.id,
        serviceId: state.selectedService?.id,
        startDatetime: state.selectedSlot?.start_datetime,
        locationType: state.locationType,
        clientAddress: state.clientAddress,
        clientNotes: state.clientNotes,
        dropId: state.dropId,
      }));
      // Redirect to login with return URL
      window.location.href = `/login?returnTo=/book/${storefront.id}`;
      return;
    }

    // Validate required fields
    if (!state.selectedService || !state.selectedSlot) {
      setState(prev => ({ ...prev, error: 'Please select a service and time slot.' }));
      return;
    }

    // Submit booking
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await createAppointment({
        storefront_id: storefront.id,
        service_id: state.selectedService.id,
        start_datetime: state.selectedSlot.start_datetime,
        service_location_type: state.locationType,
        client_address: state.locationType === 'at_client' ? state.clientAddress : undefined,
        client_notes: state.clientNotes || undefined,
        drop_id: state.dropId,
      });

      if (response.success && response.data) {
        // Success! Move to step 4
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          currentStep: 4,
          createdAppointment: response.data,
        }));
      } else {
        // Backend returned error
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          error: response.message || 'Failed to book appointment. Please try again.',
        }));
      }
    } catch (error: any) {
      // Network or unexpected error
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error.message || 'An unexpected error occurred. Please try again.',
      }));
    }
  };

  // Progress indicator
  const renderProgressIndicator = () => {
    if (state.currentStep === 4) return null; // Hide on success screen

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map(step => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              step === state.currentStep
                ? 'w-8 bg-v3-accent'
                : step < state.currentStep
                ? 'w-2 bg-v3-accent/50'
                : 'w-2 bg-v3-border'
            }`}
            aria-current={step === state.currentStep ? 'step' : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getStepTitle(state.currentStep)} size="lg">
      {renderProgressIndicator()}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {state.currentStep === 1 && (
          <BookingStepService
            services={dropServiceId ? services.filter(s => s.id === dropServiceId) : services}
            selectedServiceId={state.selectedService?.id || null}
            onSelectService={(service) =>
              setState(prev => ({ ...prev, selectedService: service }))
            }
          />
        )}

        {state.currentStep === 2 && state.selectedService && (
          <BookingStepDateTime
            storefrontId={storefront.id}
            serviceId={state.selectedService.id}
            selectedDate={state.selectedDate}
            selectedSlot={state.selectedSlot}
            onSelectDate={(date) => setState(prev => ({ ...prev, selectedDate: date }))}
            onSelectSlot={(slot) => setState(prev => ({ ...prev, selectedSlot: slot }))}
          />
        )}

        {state.currentStep === 3 && state.selectedService && state.selectedDate && state.selectedSlot && (
          <BookingStepConfirm
            storefront={storefront}
            service={state.selectedService}
            selectedDate={state.selectedDate}
            selectedSlot={state.selectedSlot}
            locationType={state.locationType}
            clientAddress={state.clientAddress}
            clientNotes={state.clientNotes}
            onLocationTypeChange={(type) => setState(prev => ({ ...prev, locationType: type }))}
            onClientAddressChange={(address) => setState(prev => ({ ...prev, clientAddress: address }))}
            onClientNotesChange={(notes) => setState(prev => ({ ...prev, clientNotes: notes }))}
            error={state.error}
          />
        )}

        {state.currentStep === 4 && state.createdAppointment && (
          <BookingSuccess
            appointment={state.createdAppointment}
            storefrontName={storefront.name}
            serviceName={state.selectedService?.name || ''}
            onClose={handleClose}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {state.currentStep !== 4 && (
        <div className="flex justify-between mt-6 pt-4 border-t border-v3-border">
          {state.currentStep > 1 && (
            <UniversalButton
              variant="outline"
              onClick={handlePrevious}
              disabled={state.isSubmitting}
            >
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
            {state.currentStep === 3 ? 'Book Appointment' : 'Next'}
          </UniversalButton>
        </div>
      )}
    </Modal>
  );
}
