import { cn } from '@/lib/utils';
import UniversalCard from '../universal/UniversalCard';
import PortfolioCard from './PortfolioCard';
import type { PublicStorefrontDetail } from '../../services/api';

interface BookingStepServiceProps {
  services: PublicStorefrontDetail['services'];
  selectedServiceId: number | null;
  onSelectService: (service: PublicStorefrontDetail['services'][0]) => void;
}

export default function BookingStepService({
  services,
  selectedServiceId,
  onSelectService,
}: BookingStepServiceProps) {
  // Filter to only active services (assuming all public services are active)
  const availableServices = services.filter(s => s.id); // All services from public endpoint should be available

  if (availableServices.length === 0) {
    return (
      <UniversalCard className="text-center py-12">
        <p className="text-v3-secondary">
          No services available for booking at this time.
        </p>
      </UniversalCard>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-v3-secondary">
        Choose a service to book:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableServices.map(service => (
          <div
            key={service.id}
            className={cn(
              'cursor-pointer transition-all rounded-3xl',
              selectedServiceId === service.id && 'ring-2 ring-v3-accent ring-offset-2'
            )}
            onClick={() => onSelectService(service)}
          >
            <PortfolioCard
              title={service.name}
              price={service.price}
              duration={service.duration}
              imageUrl={service.image_url || undefined}
              onSelect={() => {}} // Click handled by parent div
            />
          </div>
        ))}
      </div>
    </div>
  );
}
