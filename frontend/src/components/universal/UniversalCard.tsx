import React from 'react';
import { cn } from '@/lib/utils';

interface UniversalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  hoverable?: boolean;
}

export default function UniversalCard({
  noPadding = false,
  hoverable = true,
  className,
  children,
  ...props
}: UniversalCardProps) {
  return (
    <div
      className={cn(
        'bg-v3-surface border border-v3-border rounded-3xl shadow-sm overflow-hidden',
        'transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-v3-border/80',
        !noPadding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
