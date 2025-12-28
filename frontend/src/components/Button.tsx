'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'rounded-lg'
    );

    const variantStyles = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700',
        'focus:ring-primary-500',
        'dark:bg-primary-500 dark:hover:bg-primary-600'
      ),
      secondary: cn(
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
        'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
      ),
      outline: cn(
        'border border-gray-300 bg-transparent text-gray-700',
        'hover:bg-gray-50',
        'focus:ring-gray-500',
        'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
      ),
      ghost: cn(
        'bg-transparent text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
        'dark:text-gray-300 dark:hover:bg-gray-800'
      ),
      danger: cn(
        'bg-danger-600 text-white',
        'hover:bg-danger-700',
        'focus:ring-danger-500',
        'dark:bg-danger-500 dark:hover:bg-danger-600'
      ),
      success: cn(
        'bg-success-600 text-white',
        'hover:bg-success-700',
        'focus:ring-success-500',
        'dark:bg-success-500 dark:hover:bg-success-600'
      ),
    };

    const sizeStyles = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
      xl: 'px-6 py-3.5 text-lg',
    };

    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-5 w-5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
            {loadingText || children}
          </>
        ) : (
          <>
            {LeftIcon && <LeftIcon className={iconSizes[size]} />}
            {children}
            {RightIcon && <RightIcon className={iconSizes[size]} />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

/**
 * Icon button variant
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon: Icon,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'rounded-lg'
    );

    const variantStyles = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700',
        'focus:ring-primary-500'
      ),
      secondary: cn(
        'bg-gray-100 text-gray-700',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
        'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      ),
      outline: cn(
        'border border-gray-300 bg-transparent text-gray-700',
        'hover:bg-gray-50',
        'focus:ring-gray-500',
        'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
      ),
      ghost: cn(
        'bg-transparent text-gray-500',
        'hover:bg-gray-100 hover:text-gray-700',
        'focus:ring-gray-500',
        'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
      ),
      danger: cn(
        'bg-danger-600 text-white',
        'hover:bg-danger-700',
        'focus:ring-danger-500'
      ),
    };

    const sizeStyles = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
    };

    const iconSizes = {
      xs: 'h-3.5 w-3.5',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <button
        ref={ref}
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
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : (
          <Icon className={iconSizes[size]} />
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
