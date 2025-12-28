'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { Users } from 'lucide-react';

export default function AudienceBuilderPage() {
  return (
    <PlaceholderPage
      title="Audience Builder"
      subtitle="Build and segment your target audiences"
      icon={Users}
      hubName="Growth Engine"
      features={[
        'Custom audience creation',
        'Lookalike audience generation',
        'Behavioral segmentation',
        'Interest-based targeting',
        'Retargeting pixel management',
        'Audience overlap analysis',
        'Cross-platform sync',
        'Audience performance insights',
      ]}
    />
  );
}
