'use client';

import { Construction, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { type LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  hubName?: string;
  features?: string[];
}

export default function PlaceholderPage({
  title,
  subtitle,
  description = 'This feature is currently under development and will be available soon.',
  icon: Icon = Construction,
  hubName,
  features = [],
}: PlaceholderPageProps) {
  const router = useRouter();

  return (
    <div>
      <Header
        title={title}
        subtitle={subtitle}
      />
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
              <Icon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Coming Soon
            </h2>
            
            {hubName && (
              <p className="mb-4 text-sm font-medium text-primary-600 dark:text-primary-400">
                Part of {hubName}
              </p>
            )}
            
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              {description}
            </p>

            {features.length > 0 && (
              <div className="mb-8 rounded-lg bg-gray-50 p-6 text-left dark:bg-gray-900">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Planned Features
                </h3>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                leftIcon={ArrowLeft}
                onClick={() => router.back()}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/')}
              >
                Dashboard
              </Button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Development Progress
              </span>
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                In Progress
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                style={{ width: '35%' }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Estimated completion: Q1 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
