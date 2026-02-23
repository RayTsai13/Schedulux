import React from 'react';
import { format } from 'date-fns';
import UniversalCard from '../universal/UniversalCard';
import UniversalButton from '../universal/UniversalButton';

interface DropCardProps {
  title: string;
  date: Date;
  totalSlots: number;
  availableSlots: number;
  onSelect: () => void;
}

export default function DropCard({
  title,
  date,
  totalSlots,
  availableSlots,
  onSelect,
}: DropCardProps) {
  const availabilityPercent = (availableSlots / totalSlots) * 100;

  const availabilityColor =
    availabilityPercent > 50
      ? 'text-v3-secondary'
      : availabilityPercent > 20
      ? 'text-amber-600'
      : 'text-red-600';

  return (
    <UniversalCard>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Badge */}
        <div className="flex-shrink-0 w-20 h-20 bg-v3-accent rounded-2xl flex flex-col items-center justify-center text-white">
          <div className="text-xs font-bold uppercase">
            {format(date, 'EEE')}
          </div>
          <div className="text-2xl font-bold">
            {format(date, 'd')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-v3-primary mb-1">
            {title}
          </h3>
          <p className={`text-sm ${availabilityColor} font-medium`}>
            {availableSlots} {availableSlots === 1 ? 'spot' : 'spots'} left
          </p>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <UniversalButton
            variant="primary"
            size="md"
            onClick={onSelect}
            className="w-full sm:w-auto"
          >
            Claim
          </UniversalButton>
        </div>
      </div>
    </UniversalCard>
  );
}
