# Dashboard Reorganization Implementation Guide

**Date:** December 9, 2025  
**Author:** Manus AI  
**Purpose:** Step-by-step technical guide to reorganize the affiliate marketing dashboard from 11 flat tabs to 5 logical hubs.

---

## Phase 1: Frontend Structure Changes

### Step 1: Update the Navigation Data Structure

**File:** `/frontend/src/components/Sidebar.tsx`

**Current Structure:**
```typescript
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Missions', href: '/missions', icon: Brain },
  { name: 'Discovery', href: '/discovery', icon: Sparkles },
  { name: 'Offers', href: '/offers', icon: Target },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Assets', href: '/assets', icon: Image },
  { name: 'Landing Pages', href: '/landing-pages', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Integrations', href: '/integrations', icon: Network },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

**New Structure:**
```typescript
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

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavHub {
  name: string;
  icon: any;
  items: NavItem[];
}

const navigationHubs: NavHub[] = [
  {
    name: 'Intelligence',
    icon: Brain,
    items: [
      { name: 'AI Agents', href: '/intelligence/agents', icon: Brain },
      { name: 'Discovery', href: '/intelligence/discovery', icon: Sparkles },
      { name: 'Offers', href: '/intelligence/offers', icon: Target },
    ],
  },
  {
    name: 'Content Studio',
    icon: Image,
    items: [
      { name: 'Assets', href: '/content/assets', icon: Image },
      { name: 'Landing Pages', href: '/content/landing-pages', icon: FileText },
    ],
  },
  {
    name: 'Campaign Center',
    icon: Megaphone,
    items: [
      { name: 'Campaigns', href: '/campaigns/active', icon: Megaphone },
      { name: 'Email Marketing', href: '/campaigns/email', icon: Mail }, // Future
    ],
  },
  {
    name: 'Performance Lab',
    icon: BarChart3,
    items: [
      { name: 'Analytics', href: '/performance/analytics', icon: BarChart3 },
      { name: 'SEO Tracking', href: '/performance/seo', icon: Search }, // Future
      { name: 'Reports', href: '/performance/reports', icon: FileBarChart }, // Future
    ],
  },
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Automation', href: '/system/automation', icon: Zap },
      { name: 'Integrations', href: '/system/integrations', icon: Network },
      { name: 'Settings', href: '/system/settings', icon: Settings },
    ],
  },
];
```

### Step 2: Create New Sidebar Component with Collapsible Hubs

**File:** `/frontend/src/components/Sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationHubs } from './navigation-config'; // Move config to separate file

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedHubs, setExpandedHubs] = useState<string[]>([
    'Intelligence', // Default expanded
  ]);

  const toggleHub = (hubName: string) => {
    setExpandedHubs((prev) =>
      prev.includes(hubName)
        ? prev.filter((name) => name !== hubName)
        : [...prev, hubName]
    );
  };

  const isHubActive = (hub: NavHub) => {
    return hub.items.some((item) => pathname.startsWith(item.href));
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">Affiliate AI</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Dashboard - Always at top */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>

        {/* Hubs */}
        {navigationHubs.map((hub) => {
          const hubActive = isHubActive(hub);
          const isExpanded = expandedHubs.includes(hub.name);

          return (
            <div key={hub.name} className="space-y-1">
              {/* Hub Header */}
              <button
                onClick={() => toggleHub(hub.name)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  hubActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <hub.icon className="h-5 w-5" />
                  {hub.name}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Hub Items */}
              {isExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-4">
                  {hub.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isItemActive(item.href)
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">User</p>
            <p className="text-xs text-gray-500 truncate">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Update Route Structure

**Current Routes:**
```
/missions
/discovery
/offers
/campaigns
/assets
/landing-pages
/analytics
/automation
/integrations
/settings
```

**New Routes (Option A - Grouped by Hub):**
```
/intelligence/agents (formerly /missions)
/intelligence/discovery
/intelligence/offers
/content/assets
/content/landing-pages
/campaigns/active (formerly /campaigns)
/campaigns/email (future)
/performance/analytics (formerly /analytics)
/performance/seo (future)
/performance/reports (future)
/system/automation
/system/integrations
/system/settings
```

**New Routes (Option B - Keep URLs, Update Navigation Only):**
```
/missions → Keep URL, rename in nav to "AI Agents"
/discovery → Keep URL
/offers → Keep URL
/assets → Keep URL
/landing-pages → Keep URL
/campaigns → Keep URL
/analytics → Keep URL
/automation → Keep URL
/integrations → Keep URL
/settings → Keep URL
```

**Recommendation:** Use **Option B** initially to avoid breaking existing bookmarks and API routes. The navigation will show the new hierarchy, but URLs remain the same.

### Step 4: Create Redirect Rules (If Using Option A)

**File:** `/frontend/src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Redirect old URLs to new structure
  const redirects: Record<string, string> = {
    '/missions': '/intelligence/agents',
    '/discovery': '/intelligence/discovery',
    '/offers': '/intelligence/offers',
    '/assets': '/content/assets',
    '/landing-pages': '/content/landing-pages',
    '/campaigns': '/campaigns/active',
    '/analytics': '/performance/analytics',
    '/automation': '/system/automation',
    '/integrations': '/system/integrations',
    '/settings': '/system/settings',
  };

  if (redirects[url.pathname]) {
    url.pathname = redirects[url.pathname];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/missions',
    '/discovery',
    '/offers',
    '/assets',
    '/landing-pages',
    '/campaigns',
    '/analytics',
    '/automation',
    '/integrations',
    '/settings',
  ],
};
```

---

## Phase 2: Update Page Components

### Step 1: Rename "Missions" to "AI Agents"

**File:** `/frontend/src/app/missions/page.tsx` → `/frontend/src/app/intelligence/agents/page.tsx` (if using Option A)

**OR**

**File:** `/frontend/src/app/missions/page.tsx` (if using Option B)

**Update the Header:**
```typescript
<Header
  title="AI Agents"  // Changed from "Missions"
  subtitle="Launch and monitor intelligent automation tasks"
/>
```

### Step 2: Add Breadcrumb Navigation

**Create:** `/frontend/src/components/Breadcrumb.tsx`

```typescript
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      <Link href="/" className="hover:text-gray-700">
        Dashboard
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-gray-700">
              {item.name}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.name}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
```

**Usage in Pages:**
```typescript
// In /intelligence/agents/page.tsx
<Breadcrumb items={[
  { name: 'Intelligence', href: '/intelligence/discovery' },
  { name: 'AI Agents' }
]} />

// In /content/assets/page.tsx
<Breadcrumb items={[
  { name: 'Content Studio', href: '/content/assets' },
  { name: 'Assets' }
]} />
```

---

## Phase 3: Backend API Updates (Optional)

If you're using Option A (new URLs), you may want to update API routes to match:

**Current:**
```
/api/missions
/api/products (discovery)
/api/offers
/api/campaigns
/api/assets
/api/landing-pages
/api/analytics
```

**New (Optional):**
```
/api/intelligence/agents
/api/intelligence/discovery
/api/intelligence/offers
/api/content/assets
/api/content/landing-pages
/api/campaigns
/api/performance/analytics
/api/system/automation
/api/system/integrations
```

**Recommendation:** Keep API routes unchanged to avoid breaking existing integrations. The frontend reorganization doesn't require backend changes.

---

## Phase 4: Testing & Rollout

### Step 1: Create Feature Flag

**File:** `/frontend/src/lib/feature-flags.ts`

```typescript
export const FEATURES = {
  NEW_NAVIGATION: process.env.NEXT_PUBLIC_NEW_NAVIGATION === 'true',
};
```

**File:** `/frontend/.env.local`

```
NEXT_PUBLIC_NEW_NAVIGATION=true
```

### Step 2: Conditional Rendering

**File:** `/frontend/src/components/Sidebar.tsx`

```typescript
import { FEATURES } from '@/lib/feature-flags';
import OldSidebar from './OldSidebar';
import NewSidebar from './NewSidebar';

export default function Sidebar() {
  if (FEATURES.NEW_NAVIGATION) {
    return <NewSidebar />;
  }
  return <OldSidebar />;
}
```

### Step 3: A/B Test (Optional)

If you have multiple users, you can A/B test the new navigation:

```typescript
import { useUser } from '@/hooks/useUser';

export default function Sidebar() {
  const { user } = useUser();
  
  // 50% of users see new navigation
  const showNewNav = user.id % 2 === 0;
  
  if (showNewNav) {
    return <NewSidebar />;
  }
  return <OldSidebar />;
}
```

### Step 4: Gradual Rollout

**Week 1:** Enable for yourself only  
**Week 2:** Enable for 25% of users  
**Week 3:** Enable for 50% of users  
**Week 4:** Enable for 100% of users  
**Week 5:** Remove old navigation code

---

## Phase 5: Documentation Updates

### Step 1: Update User Documentation

Create a guide explaining the new structure:

**File:** `/docs/NEW_NAVIGATION_GUIDE.md`

```markdown
# New Dashboard Navigation Guide

## What Changed?

We've reorganized the dashboard into 5 logical hubs to make it easier to find what you need.

### Old Structure (11 Tabs)
- Dashboard, Missions, Discovery, Offers, Campaigns, Assets, Landing Pages, Analytics, Automation, Integrations, Settings

### New Structure (5 Hubs)
1. **Intelligence Hub** - Find and manage offers
2. **Content Studio** - Create marketing assets
3. **Campaign Center** - Launch and manage campaigns
4. **Performance Lab** - Analyze results
5. **System** - Configure and monitor

## Where Did Everything Go?

| Old Location | New Location |
|---|---|
| Missions | Intelligence → AI Agents |
| Discovery | Intelligence → Discovery |
| Offers | Intelligence → Offers |
| Assets | Content Studio → Assets |
| Landing Pages | Content Studio → Landing Pages |
| Campaigns | Campaign Center → Campaigns |
| Analytics | Performance Lab → Analytics |
| Automation | System → Automation |
| Integrations | System → Integrations |
| Settings | System → Settings |
```

### Step 2: Update API Documentation

If you changed API routes, update `/docs/API_DOCUMENTATION.md` with the new endpoints.

---

## Implementation Timeline

| Week | Tasks | Deliverable |
|---|---|---|
| **Week 1** | Create new navigation config, build new Sidebar component | Working prototype |
| **Week 2** | Update all page components with breadcrumbs, add feature flag | Feature-flagged release |
| **Week 3** | Test with 25% of users, gather feedback | Feedback report |
| **Week 4** | Fix bugs, roll out to 100% | Full release |
| **Week 5** | Remove old code, update documentation | Clean codebase |

---

## Rollback Plan

If issues arise, you can instantly revert to the old navigation:

**File:** `/frontend/.env.local`

```
NEXT_PUBLIC_NEW_NAVIGATION=false
```

Redeploy, and the old navigation will be restored.

---

## Conclusion

This reorganization will make your dashboard significantly more intuitive and professional. The implementation is straightforward and can be done incrementally with minimal risk. The new structure aligns perfectly with your original business plan and sets the foundation for future features like Email Marketing and SEO Tracking.
