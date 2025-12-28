'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { TrendingUp } from 'lucide-react';

export default function FunnelsPage() {
  return (
    <PlaceholderPage
      title="Conversion Funnels"
      subtitle="Build multi-step conversion funnels"
      icon={TrendingUp}
      hubName="Landing Pages"
      features={[
        'Visual funnel builder',
        'Multi-step sequences',
        'Upsell/downsell pages',
        'Order bump integration',
        'Thank you page customization',
        'Funnel analytics',
        'Abandonment recovery',
        'Split URL testing',
      ]}
    />
  );
}
