'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { AlertTriangle } from 'lucide-react';

export default function RiskMonitorPage() {
  return (
    <PlaceholderPage
      title="Risk Monitor"
      subtitle="Monitor compliance risks across campaigns"
      icon={AlertTriangle}
      hubName="Compliance"
      features={[
        'Real-time risk alerts',
        'Account health monitoring',
        'Policy violation tracking',
        'Risk score dashboard',
        'Automated pause triggers',
        'Historical risk analysis',
        'Risk mitigation suggestions',
        'Team notifications',
      ]}
    />
  );
}
