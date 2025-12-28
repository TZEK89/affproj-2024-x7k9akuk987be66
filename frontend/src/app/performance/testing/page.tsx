'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { TestTube } from 'lucide-react';

export default function ABTestingPage() {
  return (
    <PlaceholderPage
      title="A/B Testing"
      subtitle="Run split tests and experiments"
      icon={TestTube}
      hubName="Performance Lab"
      features={[
        'Landing page A/B tests',
        'Ad creative testing',
        'Copy variation tests',
        'Statistical significance calculator',
        'Multi-variant testing',
        'Automated winner selection',
        'Test scheduling',
        'Historical test results',
      ]}
    />
  );
}
