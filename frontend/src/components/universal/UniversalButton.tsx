import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface UniversalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function UniversalButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: UniversalButtonProps) {
  const baseStyles = cn(
    'inline-flex items-center justify-center gap-2',
    'rounded-full font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'whitespace-nowrap'
  );

  const variantStyles = {
    primary: cn(
      'bg-primary text-on-primary',
      'hover:bg-primary-container',
      'active:opacity-90'
    ),
    secondary: cn(
      'bg-outline-variant text-on-surface',
      'hover:opacity-90',
      'active:opacity-80'
    ),
    outline: cn(
      'bg-transparent border-2 border-outline-variant text-on-surface',
      'hover:bg-surface-container-low',
      'active:bg-surface-container'
    ),
    ghost: cn(
      'bg-transparent text-on-surface',
      'hover:bg-surface-container-low',
      'active:bg-surface-container'
    ),
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
