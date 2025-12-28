import {
  LayoutDashboard,
  Brain,
  Sparkles,
  Target,
  Plug,
  Image,
  FileText,
  Megaphone,
  Mail,
  BarChart3,
  Search,
  FileBarChart,
  Zap,
  Settings,
  Palette,
  Video,
  PenTool,
  Globe,
  TestTube,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Receipt,
  LineChart,
  Rocket,
  Users,
  Rss,
  Shield,
  FileCheck,
  AlertTriangle,
  Bot,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export interface NavHub {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  color: string;
  items: NavItem[];
}

/**
 * 8-Core Navigation System
 * Each hub represents a major functional area of the AI Affiliate Marketing System
 */
export const navigationHubs: NavHub[] = [
  {
    id: 'intelligence',
    name: 'Intelligence Hub',
    icon: Brain,
    description: 'Offer discovery, network integrations, and AI agents',
    color: 'text-violet-500',
    items: [
      { 
        name: 'Platform Connections', 
        href: '/integrations', 
        icon: Plug,
        description: 'Connect affiliate networks and platforms'
      },
      { 
        name: 'AI Agents', 
        href: '/missions', 
        icon: Bot,
        description: 'Manage autonomous AI agents'
      },
      { 
        name: 'Discovery', 
        href: '/discovery', 
        icon: Sparkles,
        description: 'Discover trending offers and niches'
      },
      { 
        name: 'Offers', 
        href: '/offers', 
        icon: Target,
        description: 'Browse and manage affiliate offers'
      },
    ],
  },
  {
    id: 'content',
    name: 'Content Studio',
    icon: Palette,
    description: 'AI-powered content generation and asset management',
    color: 'text-pink-500',
    items: [
      { 
        name: 'Asset Library', 
        href: '/assets', 
        icon: Image,
        description: 'Images, videos, and creative assets'
      },
      { 
        name: 'AI Copywriter', 
        href: '/content/copywriter', 
        icon: PenTool,
        description: 'Generate marketing copy with AI'
      },
      { 
        name: 'Video Studio', 
        href: '/content/video', 
        icon: Video,
        description: 'Create and edit promotional videos'
      },
    ],
  },
  {
    id: 'campaigns',
    name: 'Campaign Center',
    icon: Megaphone,
    description: 'Ad campaign management and optimization',
    color: 'text-orange-500',
    items: [
      { 
        name: 'Campaigns', 
        href: '/campaigns', 
        icon: Megaphone,
        description: 'Manage advertising campaigns'
      },
      { 
        name: 'Email Marketing', 
        href: '/campaigns/email', 
        icon: Mail,
        description: 'Email sequences and automation'
      },
      { 
        name: 'Ad Manager', 
        href: '/campaigns/ads', 
        icon: Globe,
        description: 'Facebook, Google, TikTok ads'
      },
    ],
  },
  {
    id: 'performance',
    name: 'Performance Lab',
    icon: TestTube,
    description: 'Analytics, A/B testing, and optimization',
    color: 'text-cyan-500',
    items: [
      { 
        name: 'Analytics', 
        href: '/analytics', 
        icon: BarChart3,
        description: 'Comprehensive performance analytics'
      },
      { 
        name: 'A/B Testing', 
        href: '/performance/testing', 
        icon: TestTube,
        description: 'Split tests and experiments'
      },
      { 
        name: 'Conversion Tracking', 
        href: '/performance/conversions', 
        icon: TrendingUp,
        description: 'Track conversions and attribution'
      },
      { 
        name: 'Reports', 
        href: '/performance/reports', 
        icon: FileBarChart,
        description: 'Generate detailed reports'
      },
    ],
  },
  {
    id: 'landing',
    name: 'Landing Pages',
    icon: FileText,
    description: 'Build and optimize landing pages',
    color: 'text-emerald-500',
    items: [
      { 
        name: 'Page Builder', 
        href: '/landing-pages', 
        icon: FileText,
        description: 'Drag-and-drop page builder'
      },
      { 
        name: 'Templates', 
        href: '/landing-pages/templates', 
        icon: Palette,
        description: 'Pre-built landing page templates'
      },
      { 
        name: 'Funnels', 
        href: '/landing-pages/funnels', 
        icon: TrendingUp,
        description: 'Multi-step conversion funnels'
      },
    ],
  },
  {
    id: 'financial',
    name: 'Financial Command',
    icon: DollarSign,
    description: 'P&L tracking, ROI analysis, and budgeting',
    color: 'text-green-500',
    items: [
      { 
        name: 'P&L Dashboard', 
        href: '/financial/pnl', 
        icon: LineChart,
        description: 'Profit and loss overview'
      },
      { 
        name: 'ROI Calculator', 
        href: '/financial/roi', 
        icon: DollarSign,
        description: 'Calculate return on investment'
      },
      { 
        name: 'Budget Manager', 
        href: '/financial/budget', 
        icon: PiggyBank,
        description: 'Set and track budgets'
      },
      { 
        name: 'Expenses', 
        href: '/financial/expenses', 
        icon: Receipt,
        description: 'Track advertising expenses'
      },
    ],
  },
  {
    id: 'growth',
    name: 'Growth Engine',
    icon: Rocket,
    description: 'SEO, email sequences, and audience building',
    color: 'text-blue-500',
    items: [
      { 
        name: 'SEO Tools', 
        href: '/performance/seo', 
        icon: Search,
        description: 'Keyword research and optimization'
      },
      { 
        name: 'Audience Builder', 
        href: '/growth/audience', 
        icon: Users,
        description: 'Build and segment audiences'
      },
      { 
        name: 'Social Media', 
        href: '/growth/social', 
        icon: Rss,
        description: 'Social media management'
      },
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance',
    icon: Shield,
    description: 'Policy checker and compliance monitoring',
    color: 'text-red-500',
    items: [
      { 
        name: 'Policy Checker', 
        href: '/compliance/policy', 
        icon: FileCheck,
        description: 'Check content against policies'
      },
      { 
        name: 'Risk Monitor', 
        href: '/compliance/risk', 
        icon: AlertTriangle,
        description: 'Monitor compliance risks'
      },
      { 
        name: 'Audit Log', 
        href: '/compliance/audit', 
        icon: Shield,
        description: 'View compliance audit history'
      },
    ],
  },
];

/**
 * System navigation items (settings, automation, etc.)
 */
export const systemNavItems: NavItem[] = [
  { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Settings', href: '/settings', icon: Settings },
];

/**
 * Get hub by ID
 */
export function getHubById(id: string): NavHub | undefined {
  return navigationHubs.find(hub => hub.id === id);
}

/**
 * Get all navigation items flattened
 */
export function getAllNavItems(): NavItem[] {
  return navigationHubs.flatMap(hub => hub.items);
}
