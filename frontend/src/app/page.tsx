'use client';

import { DollarSign, TrendingUp, MousePointerClick, Target } from 'lucide-react';
import Header from '@/components/Header';
import MetricCard from '@/components/MetricCard';

export default function DashboardPage() {
  // Mock data - in production, fetch from API
  const metrics = {
    totalRevenue: 47832,
    totalProfit: 28449,
    conversions: 1847,
    activeCampaigns: 47,
  };

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
            value={`$${metrics.totalRevenue.toLocaleString()}`}
            change={23.5}
            icon={DollarSign}
            iconColor="text-success-600"
          />
          <MetricCard
            title="Net Profit"
            value={`$${metrics.totalProfit.toLocaleString()}`}
            change={18.2}
            icon={TrendingUp}
            iconColor="text-primary-600"
          />
          <MetricCard
            title="Conversions"
            value={metrics.conversions.toLocaleString()}
            change={31.8}
            icon={MousePointerClick}
            iconColor="text-cyan-600"
          />
          <MetricCard
            title="Active Campaigns"
            value={metrics.activeCampaigns}
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
              Table will be rendered here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

