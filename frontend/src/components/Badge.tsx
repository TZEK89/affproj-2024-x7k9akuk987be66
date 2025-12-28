'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  rounded?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  rounded = false,
  children,
  className,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium';

  const variantStyles = {
    default: cn(
      'bg-gray-100 text-gray-700',
      'dark:bg-gray-700 dark:text-gray-300'
    ),
    primary: cn(
      'bg-primary-100 text-primary-700',
      'dark:bg-primary-900/50 dark:text-primary-300'
    ),
    secondary: cn(
      'bg-gray-100 text-gray-600',
      'dark:bg-gray-700 dark:text-gray-400'
    ),
    success: cn(
      'bg-success-100 text-success-700',
      'dark:bg-success-900/50 dark:text-success-300'
    ),
    warning: cn(
      'bg-warning-100 text-warning-700',
      'dark:bg-warning-900/50 dark:text-warning-300'
    ),
    danger: cn(
      'bg-danger-100 text-danger-700',
      'dark:bg-danger-900/50 dark:text-danger-300'
    ),
    info: cn(
      'bg-cyan-100 text-cyan-700',
      'dark:bg-cyan-900/50 dark:text-cyan-300'
    ),
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-primary-500',
    secondary: 'bg-gray-400',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-cyan-500',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Status Badge with predefined statuses
 */
export type StatusType = 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: BadgeProps['variant'] }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'warning' },
  success: { label: 'Success', variant: 'success' },
  error: { label: 'Error', variant: 'danger' },
  warning: { label: 'Warning', variant: 'warning' },
};

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showDot}
      rounded
      className={className}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Count Badge for notifications
 */
export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: 'primary' | 'danger' | 'warning';
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = 'danger',
  className,
}: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const variantStyles = {
    primary: 'bg-primary-500 text-white',
    danger: 'bg-danger-500 text-white',
    warning: 'bg-warning-500 text-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-xs font-medium',
        'min-w-[1.25rem] h-5 px-1.5',
        variantStyles[variant],
        className
      )}
    >
      {displayCount}
    </span>
  );
}
