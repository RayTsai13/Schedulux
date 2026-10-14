import { cn } from '@/lib/utils';
import UniversalCard from '../universal/UniversalCard';
import PortfolioCard from './PortfolioCard';
import type { Service } from '../../services/api';

interface BookingStepServiceProps {
  services: Service[];
  selectedServiceId: number | null;
  onSelectService: (service: Service) => void;
}

export default function BookingStepService({
  services,
  selectedServiceId,
  onSelectService,
}: BookingStepServiceProps) {
  if (services.length === 0) {
    return (
      <UniversalCard className="text-center py-12">
        <p className="text-on-surface-variant">
          No services available for booking at this time.
        </p>
      </UniversalCard>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-on-surface-variant">
        Choose a service to book:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <div
            key={service.id}
            className={cn(
              'cursor-pointer transition-all rounded-3xl',
              selectedServiceId === service.id && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSelectService(service)}
          >
            <PortfolioCard
              title={service.name}
              price={service.price ?? 0}
              duration={service.duration_minutes}
              imageUrl={service.image_url || undefined}
              onSelect={() => {}} // Click handled by parent div
            />
          </div>
        ))}
      </div>
    </div>
  );
}
