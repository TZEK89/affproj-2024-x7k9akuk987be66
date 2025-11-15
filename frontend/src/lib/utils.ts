import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-success-100 text-success-800',
    paused: 'bg-warning-100 text-warning-800',
    draft: 'bg-gray-100 text-gray-800',
    completed: 'bg-primary-100 text-primary-800',
    failed: 'bg-danger-100 text-danger-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getHealthColor(health: string): string {
  const colors: Record<string, string> = {
    excellent: 'text-success-600',
    good: 'text-primary-600',
    fair: 'text-warning-600',
    poor: 'text-orange-600',
    critical: 'text-danger-600',
  };
  return colors[health] || 'text-gray-600';
}

