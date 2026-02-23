import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Navigation } from 'lucide-react';
import UniversalCard from '../universal/UniversalCard';
import UniversalButton from '../universal/UniversalButton';

interface StorefrontCardProps {
  id: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  locationType: 'fixed' | 'mobile' | 'hybrid';
  isVerified: boolean;
  location: string;
  serviceCount: number;
  priceRange?: { min: number; max: number };
  distanceMiles?: number;
}

export default function StorefrontCard({
  id, name, description, avatarUrl, locationType,
  isVerified, location, serviceCount, priceRange, distanceMiles,
}: StorefrontCardProps) {
  const navigate = useNavigate();

  return (
    <UniversalCard noPadding className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 flex items-start gap-4">
        {/* Avatar */}
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-v3-border" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-v3-accent to-purple-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}

        {/* Name + Badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="text-xl font-semibold text-v3-primary truncate">{name}</h3>
            {isVerified && <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />}
          </div>

          {/* Location Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${locationType === 'mobile' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
            `}>
              {locationType === 'mobile' && <Navigation className="h-3 w-3" />}
              {locationType === 'mobile' ? 'Comes to you' : 'Fixed location'}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-v3-secondary">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="px-6 pb-4">
          <p className="text-sm text-v3-secondary line-clamp-2">{description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto p-6 pt-0 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-v3-secondary">{serviceCount} {serviceCount === 1 ? 'service' : 'services'}</span>
          {priceRange && <span className="font-semibold text-v3-primary">${priceRange.min} - ${priceRange.max}</span>}
        </div>

        {distanceMiles !== undefined && (
          <div className="text-xs text-v3-secondary">{distanceMiles.toFixed(1)} miles away</div>
        )}

        <UniversalButton variant="primary" size="md" onClick={() => navigate(`/book/${id}`)} className="w-full">
          View Profile
        </UniversalButton>
      </div>
    </UniversalCard>
  );
}
