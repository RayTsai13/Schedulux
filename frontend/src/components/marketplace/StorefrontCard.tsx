import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
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
  isOwned?: boolean;
  serviceCategories?: string[];
}

// ---------------------------------------------------------------------------
// StorefrontCard — editorial, image-forward card matching the reference design
// ---------------------------------------------------------------------------
export default function StorefrontCard({
  id,
  name,
  description,
  avatarUrl,
  locationType,
  isVerified,
  location,
  serviceCount,
  distanceMiles,
  isOwned = false,
  serviceCategories = [],
}: StorefrontCardProps) {
  const navigate = useNavigate();

  // Determine a badge label based on verification / location type
  const badgeLabel = isOwned
    ? 'Your Storefront'
    : isVerified
    ? 'Verified Partner'
    : locationType === 'mobile'
    ? 'Mobile Service'
    : null;

  // Primary category or fallback
  const primaryCategory = serviceCategories[0] || (locationType === 'mobile' ? 'mobile service' : 'local business');

  // Initials fallback for the image placeholder
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="group flex flex-col space-y-4 cursor-pointer"
      onClick={() => navigate(isOwned ? `/dashboard/storefront/${id}` : `/book/${id}`)}
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface-container-low relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary-container to-surface-container-high flex items-center justify-center">
            <span className="text-6xl font-headline font-bold text-primary/30">{initials}</span>
          </div>
        )}

        {/* Badge overlay */}
        {badgeLabel && (
          <div className="absolute top-4 right-4">
            <span className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-tertiary">
              {badgeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Name + Rating */}
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-primary group-hover:text-tertiary transition-colors font-headline truncate">
            {name}
          </h3>
          <p className="text-sm text-outline flex items-center gap-1 mt-1">
            <Icon name="location_on" fill className="text-xs" />
            <span className="truncate">{location}</span>
            {distanceMiles !== undefined && (
              <span className="text-on-surface-variant ml-1">· {distanceMiles.toFixed(1)} mi</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-secondary-container px-2 py-1 rounded flex-shrink-0 ml-2">
          <Icon name="star" fill className="text-sm text-on-secondary-container" />
          <span className="text-sm font-bold text-on-secondary-container">
            {serviceCount > 0 ? '4.8' : '—'}
          </span>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">{description}</p>
      )}

      {/* Footer: category + arrow */}
      <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid rgba(191,201,195,0.15)' }}>
        <span className="text-xs font-bold text-tertiary uppercase tracking-wider">
          {primaryCategory}
        </span>
        <span className="text-primary text-sm font-bold flex items-center gap-1 group/link">
          {isOwned ? 'Manage' : 'View Profile'}
          <Icon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
}
