import { cn } from '@/lib/utils';

interface SpotsMeterProps {
  remaining: number;
  total: number;
  className?: string;
}

/**
 * "3 of 8 left" with a bar that empties as a drop fills up
 */
export default function SpotsMeter({ remaining, total, className }: SpotsMeterProps) {
  const soldOut = remaining <= 0;
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const low = !soldOut && pct <= 25;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className={cn('font-bold', soldOut ? 'text-error' : low ? 'text-on-tertiary-fixed-variant' : 'text-primary')}>
          {soldOut ? 'Sold out' : `${remaining} of ${total} ${total === 1 ? 'spot' : 'spots'} left`}
        </span>
        {low && <span className="text-xs font-bold uppercase tracking-wider text-on-tertiary-fixed-variant">Almost gone</span>}
      </div>
      <div
        className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={remaining}
        aria-label="Spots remaining"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', soldOut ? 'bg-error' : low ? 'bg-tertiary' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
