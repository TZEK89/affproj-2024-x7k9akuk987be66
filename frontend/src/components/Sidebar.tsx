'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationHubs, systemNavItems, type NavHub, type NavItem } from '@/config/navigation';
import { useSidebarStore } from '@/stores/sidebarStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, expandedHubs, toggleCollapsed, toggleHub } = useSidebarStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isHubActive = (hub: NavHub) => {
    return hub.items.some((item) => pathname.startsWith(item.href));
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b border-gray-200 dark:border-gray-700',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
              <span className="text-sm font-bold text-white">AI</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Affiliate Hub
            </span>
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            isCollapsed && 'mx-auto'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* Dashboard - Always at top */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isCollapsed && 'justify-center',
            pathname === '/'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
          title="Dashboard"
        >
          <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

        {/* Navigation Hubs */}
        {navigationHubs.map((hub) => {
          const hubActive = isHubActive(hub);
          const isExpanded = expandedHubs.includes(hub.id) && !isCollapsed;

          return (
            <div key={hub.id} className="space-y-1">
              {/* Hub Header */}
              <button
                onClick={() => !isCollapsed && toggleHub(hub.id)}
                className={cn(
                  'group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isCollapsed && 'justify-center',
                  hubActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
                title={hub.name}
              >
                <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
                  <hub.icon className={cn('h-5 w-5 flex-shrink-0', hub.color)} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{hub.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </>
                  )}
                </div>
              </button>

              {/* Hub Items */}
              {isExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-4 dark:border-gray-600">
                  {hub.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                        isItemActive(item.href)
                          ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/50 dark:text-primary-300'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

        {/* System Navigation */}
        {systemNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isCollapsed && 'justify-center',
              isItemActive(item.href)
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
            title={item.name}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className={cn(
        'border-t border-gray-200 p-4 dark:border-gray-700',
        isCollapsed && 'flex justify-center'
      )}>
        {isCollapsed ? (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">U</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">User</p>
              <p className="text-xs text-gray-500 truncate dark:text-gray-400">user@example.com</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden dark:bg-gray-800"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform bg-white transition-transform duration-300 ease-in-out lg:hidden dark:bg-gray-800',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden lg:flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-300 dark:bg-gray-800 dark:border-gray-700',
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}
