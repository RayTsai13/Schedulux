import React from 'react';
import UniversalCard from '../universal/UniversalCard';
import UniversalButton from '../universal/UniversalButton';

interface PortfolioCardProps {
  title: string;
  price: number;
  duration: number;
  imageUrl?: string;
  onSelect: () => void;
}

export default function PortfolioCard({
  title,
  price,
  duration,
  imageUrl,
  onSelect,
}: PortfolioCardProps) {
  return (
    <UniversalCard noPadding>
      {/* Image Section */}
      <div className="aspect-square w-full relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-v3-accent to-purple-600 flex items-center justify-center">
            <div className="text-6xl opacity-20">✂️</div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-v3-primary mb-3">
          {title}
        </h3>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-v3-primary">
            ${price}
          </span>
          <span className="text-sm text-v3-secondary">
            {duration} min
          </span>
        </div>

        <UniversalButton
          variant="primary"
          size="md"
          onClick={onSelect}
          className="w-full"
        >
          Book Now
        </UniversalButton>
      </div>
    </UniversalCard>
  );
}
