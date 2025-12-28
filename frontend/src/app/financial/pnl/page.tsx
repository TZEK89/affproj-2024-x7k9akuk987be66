'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { LineChart } from 'lucide-react';

export default function PnLDashboardPage() {
  return (
    <PlaceholderPage
      title="P&L Dashboard"
      subtitle="Profit and loss overview across all campaigns"
      icon={LineChart}
      hubName="Financial Command"
      features={[
        'Real-time profit/loss tracking',
        'Campaign-level P&L breakdown',
        'Platform comparison analysis',
        'Daily, weekly, monthly views',
        'Cost tracking by category',
        'Revenue attribution',
        'Margin analysis',
        'Export to accounting software',
      ]}
    />
  );
}
