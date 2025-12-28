'use client';

import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  MousePointerClick, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Users,
  Zap
} from 'lucide-react';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';
import { MetricCardSkeleton, ChartCardSkeleton, TableSkeleton } from '@/components/Skeleton';
import { ErrorDisplay } from '@/components/ErrorBoundary';
import { analyticsApi } from '@/lib/api-service';
import { cn } from '@/lib/utils';

interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  conversions: number;
  activeCampaigns: number;
  clicks: number;
  impressions: number;
  conversionRate: number;
  avgOrderValue: number;
}

interface TopCampaign {
  id: string;
  name: string;
  revenue: number;
  conversions: number;
  roi: number;
  status: 'active' | 'paused' | 'ended';
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalProfit: 0,
    conversions: 0,
    activeCampaigns: 0,
    clicks: 0,
    impressions: 0,
    conversionRate: 0,
    avgOrderValue: 0,
  });
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsApi.getDashboard();
        
        if (response.success) {
          setMetrics({
            totalRevenue: response.data.totalRevenue || 0,
            totalProfit: response.data.totalProfit || 0,
            conversions: response.data.totalConversions || 0,
            activeCampaigns: response.data.activeCampaigns || 0,
            clicks: response.data.clicks || 0,
            impressions: response.data.impressions || 0,
            conversionRate: response.data.conversionRate || 0,
            avgOrderValue: response.data.avgOrderValue || 0,
          });
          setTopCampaigns(response.data.topCampaigns || []);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        // Set demo data for development
        setMetrics({
          totalRevenue: 124589,
          totalProfit: 45230,
          conversions: 1847,
          activeCampaigns: 12,
          clicks: 45230,
          impressions: 892340,
          conversionRate: 4.08,
          avgOrderValue: 67.45,
        });
        setTopCampaigns([
          { id: '1', name: 'Summer Health Bundle', revenue: 23450, conversions: 342, roi: 245, status: 'active' },
          { id: '2', name: 'Fitness Program Launch', revenue: 18920, conversions: 278, roi: 189, status: 'active' },
          { id: '3', name: 'Weight Loss Supplement', revenue: 15680, conversions: 234, roi: 156, status: 'active' },
          { id: '4', name: 'Keto Diet Guide', revenue: 12340, conversions: 189, roi: 134, status: 'paused' },
          { id: '5', name: 'Home Workout System', revenue: 9870, conversions: 156, roi: 112, status: 'active' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Overview of your affiliate marketing performance"
      />

      <div className="p-4 lg:p-6 space-y-6">
        {error && (
          <ErrorDisplay
            title="Data Loading Issue"
            message="Using demo data. Connect to backend for live data."
            className="mb-4"
          />
        )}

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(metrics.totalRevenue)}
                change={23.5}
                icon={DollarSign}
                iconColor="text-success-600 dark:text-success-400"
              />
              <MetricCard
                title="Net Profit"
                value={formatCurrency(metrics.totalProfit)}
                change={18.2}
                icon={TrendingUp}
                iconColor="text-primary-600 dark:text-primary-400"
              />
              <MetricCard
                title="Conversions"
                value={formatNumber(metrics.conversions)}
                change={31.8}
                icon={MousePointerClick}
                iconColor="text-cyan-600 dark:text-cyan-400"
              />
              <MetricCard
                title="Active Campaigns"
                value={metrics.activeCampaigns}
                change={-5.3}
                icon={Target}
                iconColor="text-orange-600 dark:text-orange-400"
              />
            </>
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading ? (
            <>
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </>
          ) : (
            <>
              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Clicks</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatNumber(metrics.clicks)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Impressions</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatNumber(metrics.impressions)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/30">
                    <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Conv. Rate</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {metrics.conversionRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
                    <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Order</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${metrics.avgOrderValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {loading ? (
            <>
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </>
          ) : (
            <>
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Revenue by Platform
                  </h3>
                  <select className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Chart visualization coming soon
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Performance Trend
                  </h3>
                  <select className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option>Revenue</option>
                    <option>Conversions</option>
                    <option>Clicks</option>
                  </select>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Chart visualization coming soon
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Top Campaigns Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Performing Campaigns
                </h3>
                <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  View All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Conversions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      ROI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {topCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white">
                          {formatCurrency(campaign.revenue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white">
                          {formatNumber(campaign.conversions)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {campaign.roi > 100 ? (
                            <ArrowUpRight className="h-4 w-4 text-success-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-danger-500" />
                          )}
                          <span className={cn(
                            'font-medium',
                            campaign.roi > 100 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                          )}>
                            {campaign.roi}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          campaign.status === 'active' && 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300',
                          campaign.status === 'paused' && 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300',
                          campaign.status === 'ended' && 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        )}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="group rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-left text-white shadow-sm transition-all hover:shadow-md hover:from-primary-600 hover:to-primary-700">
            <h4 className="font-semibold">Create Campaign</h4>
            <p className="mt-1 text-sm text-primary-100">Launch a new ad campaign</p>
          </button>
          <button className="group rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-left text-white shadow-sm transition-all hover:shadow-md hover:from-emerald-600 hover:to-emerald-700">
            <h4 className="font-semibold">Find Offers</h4>
            <p className="mt-1 text-sm text-emerald-100">Discover profitable offers</p>
          </button>
          <button className="group rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 p-4 text-left text-white shadow-sm transition-all hover:shadow-md hover:from-violet-600 hover:to-violet-700">
            <h4 className="font-semibold">Generate Content</h4>
            <p className="mt-1 text-sm text-violet-100">Create AI-powered content</p>
          </button>
          <button className="group rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-left text-white shadow-sm transition-all hover:shadow-md hover:from-amber-600 hover:to-amber-700">
            <h4 className="font-semibold">View Reports</h4>
            <p className="mt-1 text-sm text-amber-100">Analyze performance data</p>
          </button>
        </div>
      </div>
    </div>
  );
}
