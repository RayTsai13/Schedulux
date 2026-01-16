import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, parseISO } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  Store,
  Loader2,
  MapPin,
  DollarSign,
} from 'lucide-react';

import { useStorefront } from '../../hooks/useStorefronts';
import { useServices } from '../../hooks/useServices';
import { useAvailability } from '../../hooks/useAvailability';
import { useCreateAppointment } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';
import type { Service, AvailableSlot } from '../../services/api';

/**
 * BookingPage - Client-side appointment booking flow
 *
 * Flow:
 * 1. Select a service
 * 2. Pick a date
 * 3. Choose an available time slot
 * 4. Confirm booking
 */

type BookingStep = 'service' | 'datetime' | 'confirm';

const BookingPage = () => {
  const { storefrontId } = useParams<{ storefrontId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const parsedStorefrontId = storefrontId ? parseInt(storefrontId, 10) : null;

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [clientNotes, setClientNotes] = useState('');
  // Marketplace: client address for mobile/hybrid vendors
  const [clientAddress, setClientAddress] = useState('');
  const [serviceLocationType, setServiceLocationType] = useState<'at_vendor' | 'at_client'>('at_vendor');

  // Data fetching
  const { data: storefront, isLoading: storefrontLoading } = useStorefront(parsedStorefrontId);
  const { data: services = [], isLoading: servicesLoading } = useServices(parsedStorefrontId);

  // Availability - fetch when service and date are selected
  const endDate = useMemo(() => format(addDays(parseISO(selectedDate), 6), 'yyyy-MM-dd'), [selectedDate]);
  const { data: availability, isLoading: availabilityLoading } = useAvailability({
    storefrontId: parsedStorefrontId,
    serviceId: selectedService?.id ?? null,
    startDate: selectedDate,
    endDate: endDate,
  });

  // Booking mutation
  const createAppointment = useCreateAppointment();

  // Group slots by date for display
  const slotsByDate = useMemo(() => {
    if (!availability?.slots) return {};
    return availability.slots.reduce((acc, slot) => {
      const date = slot.local_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(slot);
      return acc;
    }, {} as Record<string, AvailableSlot[]>);
  }, [availability]);

  // Handlers
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setCurrentStep('datetime');
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedSlot || !parsedStorefrontId) return;

    // Validate client address for at_client bookings
    if (serviceLocationType === 'at_client' && !clientAddress.trim()) {
      alert('Please enter your address for the appointment');
      return;
    }

    createAppointment.mutate(
      {
        storefront_id: parsedStorefrontId,
        service_id: selectedService.id,
        start_datetime: selectedSlot.start_datetime,
        client_notes: clientNotes || undefined,
        // Marketplace location fields
        service_location_type: serviceLocationType,
        client_address: serviceLocationType === 'at_client' ? clientAddress : undefined,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            navigate('/dashboard', {
              state: { message: 'Appointment booked successfully!' }
            });
          }
        },
      }
    );
  };

  const handleBack = () => {
    if (currentStep === 'datetime') {
      setCurrentStep('service');
      setSelectedService(null);
    } else if (currentStep === 'confirm') {
      setCurrentStep('datetime');
      setSelectedSlot(null);
    }
  };

  // Loading state
  if (storefrontLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading booking information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!storefront) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center max-w-md">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Storefront Not Found</h2>
            <p className="text-gray-600 mb-4">
              The storefront you're looking for doesn't exist or is no longer available.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auth check for booking
  if (!isAuthenticated && currentStep === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-sm">
            <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to complete your booking.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login', { state: { from: location.pathname } })}
                className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup', { state: { from: location.pathname } })}
                className="w-full bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Booking Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center space-x-1 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{storefront.name}</h1>
              {storefront.address && (
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {storefront.address}
                </p>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-8">
            {['service', 'datetime', 'confirm'].map((step, index) => {
              const stepLabels = { service: 'Service', datetime: 'Date & Time', confirm: 'Confirm' };
              const isActive = step === currentStep;
              const isCompleted =
                (step === 'service' && currentStep !== 'service') ||
                (step === 'datetime' && currentStep === 'confirm');

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted ? 'bg-purple-600 text-white' : ''}
                      ${isActive ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-600' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}
                    `}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-purple-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {stepLabels[step as keyof typeof stepLabels]}
                  </span>
                  {index < 2 && (
                    <ArrowRight className="w-4 h-4 mx-4 text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Service Selection */}
        {currentStep === 'service' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select a Service</h2>
            {services.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-500">No services available at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.filter(s => s.is_active).map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className="w-full bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration_minutes} min
                          </span>
                          {service.price && (
                            <span className="text-sm text-gray-600 flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {service.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {currentStep === 'datetime' && selectedService && (
          <div>
            <button
              onClick={handleBack}
              className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Change Service
            </button>

            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-purple-800">
                <span className="font-medium">{selectedService.name}</span>
                {' '}&middot;{' '}
                {selectedService.duration_minutes} min
                {selectedService.price && ` · $${selectedService.price.toFixed(2)}`}
              </p>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Date & Time</h2>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), -7), 'yyyy-MM-dd'))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-medium text-gray-900">
                {format(parseISO(selectedDate), 'MMMM d')} - {format(addDays(parseISO(selectedDate), 6), 'MMMM d, yyyy')}
              </span>
              <button
                onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 7), 'yyyy-MM-dd'))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {availabilityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : Object.keys(slotsByDate).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No available slots for this week.</p>
                <p className="text-sm text-gray-400 mt-1">Try selecting a different week.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date} className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-medium text-gray-900 mb-4">
                      {format(parseISO(date), 'EEEE, MMMM d')}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.start_datetime}
                          onClick={() => handleSelectSlot(slot)}
                          className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                        >
                          {slot.local_start_time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirm' && selectedService && selectedSlot && (
          <div>
            <button
              onClick={handleBack}
              className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Change Time
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-6">Confirm Your Booking</h2>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {/* Booking Summary */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Store className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{storefront.name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">
                      {selectedService.name} ({selectedService.duration_minutes} min)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {format(parseISO(selectedSlot.local_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-gray-600">
                      {selectedSlot.local_start_time} - {selectedSlot.local_end_time}
                    </p>
                  </div>
                </div>

                {selectedService.price && (
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium text-gray-900">${selectedService.price.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Location - for mobile/hybrid vendors */}
              {storefront && (storefront.location_type === 'mobile' || storefront.location_type === 'hybrid') && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Where should the appointment take place?
                  </label>
                  <div className="space-y-3">
                    {storefront.location_type === 'hybrid' && (
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition-colors">
                        <input
                          type="radio"
                          name="location"
                          value="at_vendor"
                          checked={serviceLocationType === 'at_vendor'}
                          onChange={() => setServiceLocationType('at_vendor')}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">At vendor's location</p>
                          {storefront.address && (
                            <p className="text-sm text-gray-500">{storefront.address}</p>
                          )}
                        </div>
                      </label>
                    )}
                    <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition-colors">
                      <input
                        type="radio"
                        name="location"
                        value="at_client"
                        checked={serviceLocationType === 'at_client'}
                        onChange={() => setServiceLocationType('at_client')}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">At my location</p>
                        <p className="text-sm text-gray-500">The provider will come to you</p>
                      </div>
                    </label>

                    {serviceLocationType === 'at_client' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          placeholder="Enter your full address..."
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes for the vendor (optional)
                </label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Any special requests or information..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmBooking}
                disabled={createAppointment.isPending}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {createAppointment.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>

              {createAppointment.isError && (
                <p className="text-sm text-red-600 text-center">
                  {createAppointment.error?.message || 'Failed to book appointment. Please try again.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
