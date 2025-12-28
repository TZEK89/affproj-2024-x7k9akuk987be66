'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { Rss } from 'lucide-react';

export default function SocialMediaPage() {
  return (
    <PlaceholderPage
      title="Social Media Manager"
      subtitle="Manage your social media presence"
      icon={Rss}
      hubName="Growth Engine"
      features={[
        'Multi-platform posting',
        'Content calendar',
        'Post scheduling',
        'Engagement tracking',
        'Hashtag research',
        'Competitor analysis',
        'Influencer discovery',
        'Social listening',
      ]}
    />
  );
}
