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
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-v3-accent',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'whitespace-nowrap'
  );

  const variantStyles = {
    primary: cn(
      'bg-v3-primary text-white',
      'hover:bg-zinc-800',
      'active:bg-zinc-950'
    ),
    secondary: cn(
      'bg-v3-border text-v3-primary',
      'hover:bg-zinc-300',
      'active:bg-zinc-400'
    ),
    outline: cn(
      'bg-transparent border-2 border-v3-border text-v3-primary',
      'hover:bg-v3-surface-highlight',
      'active:bg-zinc-200'
    ),
    ghost: cn(
      'bg-transparent text-v3-primary',
      'hover:bg-v3-surface-highlight',
      'active:bg-zinc-200'
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
