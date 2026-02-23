import { format } from 'date-fns';
import UniversalCard from '../universal/UniversalCard';
import type { PublicStorefrontDetail, AvailableSlot, ServiceLocationType } from '../../services/api';

interface BookingStepConfirmProps {
  storefront: PublicStorefrontDetail['storefront'];
  service: PublicStorefrontDetail['services'][0];
  selectedDate: Date;
  selectedSlot: AvailableSlot;
  locationType: ServiceLocationType;
  clientAddress?: string;
  clientNotes?: string;
  onLocationTypeChange: (type: ServiceLocationType) => void;
  onClientAddressChange: (address: string) => void;
  onClientNotesChange: (notes: string) => void;
  error?: string | null;
}

export default function BookingStepConfirm({
  storefront,
  service,
  selectedDate,
  selectedSlot,
  locationType,
  clientAddress,
  clientNotes,
  onLocationTypeChange,
  onClientAddressChange,
  onClientNotesChange,
  error,
}: BookingStepConfirmProps) {
  // Check if vendor offers mobile services
  const isMobileOrHybrid = storefront.location_type === 'mobile' || storefront.location_type === 'hybrid';

  return (
    <div className="space-y-6">
      {/* Review Card */}
      <UniversalCard>
        <h3 className="text-lg font-semibold text-v3-primary mb-4">Booking Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-v3-secondary">Service:</span>
            <span className="font-medium text-v3-primary">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-v3-secondary">Date:</span>
            <span className="font-medium text-v3-primary">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-v3-secondary">Time:</span>
            <span className="font-medium text-v3-primary">
              {selectedSlot.local_start_time} - {selectedSlot.local_end_time}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-v3-secondary">Duration:</span>
            <span className="font-medium text-v3-primary">{service.duration} minutes</span>
          </div>
          {service.price && (
            <div className="flex justify-between pt-3 border-t border-v3-border">
              <span className="text-v3-secondary">Price:</span>
              <span className="font-semibold text-lg text-v3-primary">${service.price}</span>
            </div>
          )}
        </div>
      </UniversalCard>

      {/* Location Type Selector (only for mobile/hybrid vendors) */}
      {isMobileOrHybrid && (
        <div>
          <h3 className="text-lg font-semibold text-v3-primary mb-3">Service Location</h3>
          <div className="space-y-2">
            {/* At Vendor Location (only if hybrid or has fixed address) */}
            {(storefront.location_type === 'hybrid' || storefront.address) && (
              <label className="flex items-start gap-3 p-4 border-2 border-v3-border rounded-2xl cursor-pointer hover:bg-v3-surface-highlight transition-colors">
                <input
                  type="radio"
                  name="locationType"
                  value="at_vendor"
                  checked={locationType === 'at_vendor'}
                  onChange={(e) => onLocationTypeChange('at_vendor')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-v3-primary">At {storefront.name}'s location</div>
                  {storefront.address && (
                    <div className="text-sm text-v3-secondary mt-1">{storefront.address}</div>
                  )}
                </div>
              </label>
            )}

            {/* At Client Location */}
            <label className="flex items-start gap-3 p-4 border-2 border-v3-border rounded-2xl cursor-pointer hover:bg-v3-surface-highlight transition-colors">
              <input
                type="radio"
                name="locationType"
                value="at_client"
                checked={locationType === 'at_client'}
                onChange={(e) => onLocationTypeChange('at_client')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-v3-primary">At my location</div>
                <div className="text-sm text-v3-secondary mt-1">
                  Service area: {storefront.service_area_city || storefront.city}
                  {storefront.service_radius && ` (${storefront.service_radius}mi radius)`}
                </div>
              </div>
            </label>
          </div>

          {/* Client Address Input (only if at_client selected) */}
          {locationType === 'at_client' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-v3-primary mb-2">
                Your Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => onClientAddressChange(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                className="w-full px-4 py-3 border-2 border-v3-border rounded-xl focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent"
                required
              />
            </div>
          )}
        </div>
      )}

      {/* Optional Notes */}
      <div>
        <label className="block text-sm font-medium text-v3-primary mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          value={clientNotes}
          onChange={(e) => onClientNotesChange(e.target.value)}
          placeholder="Any special requests or notes for the vendor..."
          rows={3}
          className="w-full px-4 py-3 border-2 border-v3-border rounded-xl focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent resize-none"
        />
      </div>

      {/* Error Display */}
      {error && (
        <UniversalCard className="bg-red-50 border-2 border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </UniversalCard>
      )}
    </div>
  );
}
