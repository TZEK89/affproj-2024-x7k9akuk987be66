'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationHubs, type NavHub } from '@/config/navigation';

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
