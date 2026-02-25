import { Clock, DollarSign, Edit, Trash2, Plus } from 'lucide-react';
import UniversalButton from '../universal/UniversalButton';
import UniversalCard from '../universal/UniversalCard';
import type { Service } from '../../services/api';

interface ServicesTabProps {
  services: Service[] | undefined;
  onAddService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (serviceId: number) => void;
}

export default function ServicesTab({
  services,
  onAddService,
  onEditService,
  onDeleteService,
}: ServicesTabProps) {
  if (!services || services.length === 0) {
    return (
      <UniversalCard className="p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-v3-secondary/40" />
        <h3 className="text-lg font-semibold text-v3-primary mb-2">No services yet</h3>
        <p className="text-v3-secondary mb-6">Add services that customers can book.</p>
        <UniversalButton variant="primary" onClick={onAddService}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </UniversalButton>
      </UniversalCard>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-v3-secondary text-sm">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        <UniversalButton variant="primary" size="md" onClick={onAddService}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </UniversalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <UniversalCard key={service.id} className="p-6 flex flex-col">
            <div className="flex-1 mb-4">
              <h3 className="text-lg font-semibold text-v3-primary mb-1">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-v3-secondary line-clamp-2">{service.description}</p>
              )}
            </div>

            <div className="space-y-1.5 mb-4">
              {service.price && (
                <div className="flex items-center gap-2 text-sm text-v3-secondary">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  <span>${service.price}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-v3-secondary">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{service.duration_minutes} min</span>
              </div>
              {service.category && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-v3-accent/10 text-v3-accent rounded-full">
                  {service.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-v3-border">
              <UniversalButton variant="ghost" size="sm" onClick={() => onEditService(service)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </UniversalButton>
              <UniversalButton variant="ghost" size="sm" onClick={() => onDeleteService(service.id)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </UniversalButton>
            </div>
          </UniversalCard>
        ))}
      </div>
    </div>
  );
}
