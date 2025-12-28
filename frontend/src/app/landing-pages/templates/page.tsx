'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { Palette } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <PlaceholderPage
      title="Page Templates"
      subtitle="Pre-built landing page templates"
      icon={Palette}
      hubName="Landing Pages"
      features={[
        'High-converting template library',
        'Niche-specific designs',
        'Mobile-optimized layouts',
        'One-click customization',
        'A/B test variants included',
        'Regular template updates',
        'Custom template creation',
        'Template performance stats',
      ]}
    />
  );
}
