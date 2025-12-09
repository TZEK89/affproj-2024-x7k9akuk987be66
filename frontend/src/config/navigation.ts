import {
  LayoutDashboard,
  Brain,
  Sparkles,
  Target,
  Image,
  FileText,
  Megaphone,
  Mail,
  BarChart3,
  Search,
  FileBarChart,
  Zap,
  Network,
  Settings,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
}

export interface NavHub {
  name: string;
  icon: any;
  items: NavItem[];
}

export const navigationHubs: NavHub[] = [
  {
    name: 'Intelligence',
    icon: Brain,
    items: [
      { name: 'AI Agents', href: '/missions', icon: Brain },
      { name: 'Discovery', href: '/discovery', icon: Sparkles },
      { name: 'Offers', href: '/offers', icon: Target },
    ],
  },
  {
    name: 'Content Studio',
    icon: Image,
    items: [
      { name: 'Assets', href: '/assets', icon: Image },
      { name: 'Landing Pages', href: '/landing-pages', icon: FileText },
    ],
  },
  {
    name: 'Campaign Center',
    icon: Megaphone,
    items: [
      { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
      { name: 'Email Marketing', href: '/campaigns/email', icon: Mail },
    ],
  },
  {
    name: 'Performance Lab',
    icon: BarChart3,
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'SEO Tracking', href: '/performance/seo', icon: Search },
      { name: 'Reports', href: '/performance/reports', icon: FileBarChart },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Automation', href: '/automation', icon: Zap },
      { name: 'Integrations', href: '/integrations', icon: Network },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];
