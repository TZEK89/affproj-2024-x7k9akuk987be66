'use client';

import { useState } from 'react';
import { Calendar, Download, TrendingUp, DollarSign, MousePointerClick, Target } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import MetricCard from '@/components/MetricCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');

  // Mock data for charts
  const performanceTrend = [
    { date: 'Oct 1', spend: 450, revenue: 1250, profit: 800 },
    { date: 'Oct 5', spend: 520, revenue: 1450, profit: 930 },
    { date: 'Oct 10', spend: 680, revenue: 1820, profit: 1140 },
    { date: 'Oct 15', spend: 750, revenue: 2100, profit: 1350 },
    { date: 'Oct 20', spend: 820, revenue: 2350, profit: 1530 },
    { date: 'Oct 25', spend: 890, revenue: 2680, profit: 1790 },
    { date: 'Oct 29', spend: 950, revenue: 2950, profit: 2000 },
  ];

  const revenueByPlatform = [
    { name: 'Meta Ads', value: 18500, campaigns: 15 },
    { name: 'Google Ads', value: 14200, campaigns: 12 },
    { name: 'TikTok Ads', value: 9800, campaigns: 8 },
    { name: 'Pinterest', value: 5300, campaigns: 6 },
  ];

  const revenueByNiche = [
    { niche: 'Health & Fitness', revenue: 15200, spend: 5800, roas: 2.62 },
    { niche: 'Personal Finance', revenue: 12800, spend: 4200, roas: 3.05 },
    { niche: 'Online Education', revenue: 10500, spend: 4500, roas: 2.33 },
    { niche: 'Home & Garden', revenue: 6200, spend: 2800, roas: 2.21 },
    { niche: 'Technology', revenue: 3100, spend: 1200, roas: 2.58 },
  ];

  const conversionFunnel = [
    { stage: 'Clicks', value: 45230, percentage: 100 },
    { stage: 'Landing Page Views', value: 38450, percentage: 85 },
    { stage: 'Add to Cart', value: 12340, percentage: 27 },
    { stage: 'Initiated Checkout', value: 5670, percentage: 13 },
    { stage: 'Conversions', value: 1847, percentage: 4 },
  ];

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div>
      <Header
        title="Analytics"
        subtitle="Advanced performance analytics and insights"
      />

      <div className="p-6 space-y-6">
        {/* Date Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
            </select>
          </div>
          <Button variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value="$47,832"
            change={23.5}
            icon={DollarSign}
            iconColor="text-success-600"
          />
          <MetricCard
            title="Net Profit"
            value="$28,449"
            change={18.2}
            icon={TrendingUp}
            iconColor="text-primary-600"
          />
          <MetricCard
            title="Total Clicks"
            value="45,230"
            change={31.8}
            icon={MousePointerClick}
            iconColor="text-cyan-600"
          />
          <MetricCard
            title="Conversions"
            value="1,847"
            change={15.4}
            icon={Target}
            iconColor="text-orange-600"
          />
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
              <p className="text-sm text-gray-500 mt-1">Revenue, spend, and profit over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#ef4444"
                strokeWidth={2}
                name="Spend"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue by Platform */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue by Platform</h3>
              <p className="text-sm text-gray-500 mt-1">Distribution across ad platforms</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {revenueByPlatform.map((platform, index) => (
                <div key={platform.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-700">{platform.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">{platform.campaigns} campaigns</span>
                    <span className="font-medium text-gray-900">
                      ${platform.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Niche */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue by Niche</h3>
              <p className="text-sm text-gray-500 mt-1">Performance across different niches</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByNiche}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="niche" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                <Bar dataKey="spend" fill="#ef4444" name="Spend" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
            <p className="text-sm text-gray-500 mt-1">User journey from click to conversion</p>
          </div>
          <div className="space-y-4">
            {conversionFunnel.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{stage.percentage}%</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 flex items-center justify-center text-white font-medium text-sm"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  >
                    {stage.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Overall Conv. Rate</div>
              <div className="mt-1 text-2xl font-bold text-primary-600">4.08%</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Avg. Order Value</div>
              <div className="mt-1 text-2xl font-bold text-success-600">$25.89</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Cost Per Conversion</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">$10.02</div>
            </div>
          </div>
        </div>

        {/* Top Performers Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROAS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Yoga Burn - Weight Loss Women 35+
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$3,450</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success-600">$14,832</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">4.30x</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">247</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Credit Repair - Search Campaign
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$4,200</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success-600">$11,550</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">2.75x</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">77</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

