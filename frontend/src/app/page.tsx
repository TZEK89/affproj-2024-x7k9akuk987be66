'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, MousePointerClick, Target } from 'lucide-react';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';
import { analyticsApi } from '@/lib/api-service';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    conversions: 0,
    activeCampaigns: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await analyticsApi.getDashboard();
        
        if (response.success) {
          setMetrics({
            totalRevenue: response.data.totalRevenue || 0,
            totalProfit: response.data.totalProfit || 0,
            conversions: response.data.totalConversions || 0,
            activeCampaigns: response.data.activeCampaigns || 0,
          });
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div>
        <Header
          title="Dashboard"
          subtitle="Overview of your affiliate marketing performance"
        />
        <div className="p-6">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of your affiliate marketing performance"
      />

      <div className="p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={loading ? '...' : `$${metrics.totalRevenue.toLocaleString()}`}
            change={23.5}
            icon={DollarSign}
            iconColor="text-success-600"
          />
          <MetricCard
            title="Net Profit"
            value={loading ? '...' : `$${metrics.totalProfit.toLocaleString()}`}
            change={18.2}
            icon={TrendingUp}
            iconColor="text-primary-600"
          />
          <MetricCard
            title="Conversions"
            value={loading ? '...' : metrics.conversions.toLocaleString()}
            change={31.8}
            icon={MousePointerClick}
            iconColor="text-cyan-600"
          />
          <MetricCard
            title="Active Campaigns"
            value={loading ? '...' : metrics.activeCampaigns}
            change={-5.3}
            icon={Target}
            iconColor="text-orange-600"
          />
        </div>

        {/* Charts and Tables will go here */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue by Platform
            </h3>
            <div className="flex items-center justify-center h-64 text-gray-400">
              Chart will be rendered here
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Trend
            </h3>
            <div className="flex items-center justify-center h-64 text-gray-400">
              Chart will be rendered here
            </div>
          </div>
        </div>

        {/* Top Campaigns Table */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Performing Campaigns
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-48 text-gray-400">
              {loading ? 'Loading...' : 'Table will be rendered here'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
