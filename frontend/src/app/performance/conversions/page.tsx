'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { TrendingUp } from 'lucide-react';

export default function ConversionTrackingPage() {
  return (
    <PlaceholderPage
      title="Conversion Tracking"
      subtitle="Track conversions and attribution"
      icon={TrendingUp}
      hubName="Performance Lab"
      features={[
        'Multi-touch attribution',
        'Conversion pixel management',
        'Postback URL setup',
        'Server-side tracking',
        'Cross-device tracking',
        'Conversion value optimization',
        'Funnel visualization',
        'Attribution model comparison',
      ]}
    />
  );
}
