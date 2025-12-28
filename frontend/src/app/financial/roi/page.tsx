'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { DollarSign } from 'lucide-react';

export default function ROICalculatorPage() {
  return (
    <PlaceholderPage
      title="ROI Calculator"
      subtitle="Calculate return on investment for campaigns"
      icon={DollarSign}
      hubName="Financial Command"
      features={[
        'Campaign ROI calculation',
        'ROAS (Return on Ad Spend) tracking',
        'Break-even analysis',
        'Projected ROI forecasting',
        'Multi-campaign comparison',
        'Historical ROI trends',
        'Goal setting and tracking',
        'Optimization recommendations',
      ]}
    />
  );
}
