'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { Globe } from 'lucide-react';

export default function AdManagerPage() {
  return (
    <PlaceholderPage
      title="Ad Manager"
      subtitle="Manage Facebook, Google, and TikTok ads"
      icon={Globe}
      hubName="Campaign Center"
      features={[
        'Multi-platform ad management',
        'Facebook/Meta Ads integration',
        'Google Ads management',
        'TikTok Ads support',
        'Unified ad creation',
        'Cross-platform reporting',
        'Automated rules engine',
        'Budget optimization',
      ]}
    />
  );
}
