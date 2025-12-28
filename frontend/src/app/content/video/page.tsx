'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { Video } from 'lucide-react';

export default function VideoStudioPage() {
  return (
    <PlaceholderPage
      title="Video Studio"
      subtitle="Create and edit promotional videos"
      icon={Video}
      hubName="Content Studio"
      features={[
        'AI video generation from scripts',
        'Template-based video creation',
        'Auto-captioning and subtitles',
        'Background music library',
        'Brand overlay templates',
        'Video thumbnail generator',
        'Multi-platform export (TikTok, YouTube, Instagram)',
        'Performance tracking integration',
      ]}
    />
  );
}
