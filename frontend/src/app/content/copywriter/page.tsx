'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { PenTool } from 'lucide-react';

export default function CopywriterPage() {
  return (
    <PlaceholderPage
      title="AI Copywriter"
      subtitle="Generate high-converting marketing copy with AI"
      icon={PenTool}
      hubName="Content Studio"
      features={[
        'AI-powered headline generation',
        'Email sequence templates',
        'Ad copy variations (Facebook, Google, TikTok)',
        'Landing page copy optimization',
        'A/B test copy suggestions',
        'Multi-language support',
        'Brand voice customization',
        'Copy performance analytics',
      ]}
    />
  );
}
