import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary-600',
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-success-600',
                  isNegative && 'text-danger-600',
                  !isPositive && !isNegative && 'text-gray-600'
                )}
              >
                {isPositive && '+'}
                {change.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg bg-gray-50 p-3', iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

