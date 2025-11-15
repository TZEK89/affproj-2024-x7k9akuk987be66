import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success-100 text-success-800',
      paused: 'bg-warning-100 text-warning-800',
      draft: 'bg-gray-100 text-gray-800',
      completed: 'bg-primary-100 text-primary-800',
      excellent: 'bg-success-100 text-success-800',
      good: 'bg-primary-100 text-primary-800',
      fair: 'bg-warning-100 text-warning-800',
      poor: 'bg-orange-100 text-orange-800',
      critical: 'bg-danger-100 text-danger-800',
    };
    return styles[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusStyles(status),
        className
      )}
    >
      {status}
    </span>
  );
}

