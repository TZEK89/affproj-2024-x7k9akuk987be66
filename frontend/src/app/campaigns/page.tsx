'use client';

import { useState } from 'react';
import { Plus, Filter, Play, Pause, TrendingUp, TrendingDown } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Campaign } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CampaignsPage() {
  // Mock data - in production, fetch from API
  const [campaigns] = useState<Campaign[]>([
    {
      id: 1,
      offer_id: 1,
      offer: {
        id: 1,
        network_id: 1,
        name: 'Yoga Burn Challenge',
        url: 'https://example.com/yoga',
        niche: 'Health & Fitness',
        commission_type: 'percentage',
        commission_value: 75,
        is_active: true,
        created_at: '2024-10-15T10:00:00Z',
        updated_at: '2024-10-28T15:30:00Z',
      },
      platform_id: 1,
      platform: { id: 1, name: 'Meta Ads', slug: 'meta', is_active: true },
      name: 'Yoga Burn - Weight Loss Women 35+',
      status: 'active',
      daily_budget: 500,
      total_budget: 15000,
      target_roas: 2.5,
      start_date: '2024-10-20T00:00:00Z',
      created_at: '2024-10-18T10:00:00Z',
      updated_at: '2024-10-29T08:30:00Z',
      spend: 3450,
      revenue: 14832,
      profit: 11382,
      roas: 4.3,
      clicks: 8234,
      conversions: 247,
      health_status: 'excellent',
    },
    {
      id: 2,
      offer_id: 2,
      offer: {
        id: 2,
        network_id: 2,
        name: 'Credit Repair Blueprint',
        url: 'https://example.com/credit',
        niche: 'Personal Finance',
        commission_type: 'fixed',
        commission_value: 150,
        is_active: true,
        created_at: '2024-10-12T14:20:00Z',
        updated_at: '2024-10-27T09:15:00Z',
      },
      platform_id: 2,
      platform: { id: 2, name: 'Google Ads', slug: 'google', is_active: true },
      name: 'Credit Repair - Search Campaign',
      status: 'active',
      daily_budget: 300,
      total_budget: 9000,
      target_roas: 3.0,
      start_date: '2024-10-15T00:00:00Z',
      created_at: '2024-10-14T14:00:00Z',
      updated_at: '2024-10-29T09:00:00Z',
      spend: 4200,
      revenue: 11550,
      profit: 7350,
      roas: 2.75,
      clicks: 5678,
      conversions: 77,
      health_status: 'good',
    },
    {
      id: 3,
      offer_id: 3,
      offer: {
        id: 3,
        network_id: 1,
        name: 'Digital Marketing Mastery',
        url: 'https://example.com/marketing',
        niche: 'Online Education',
        commission_type: 'percentage',
        commission_value: 50,
        is_active: false,
        created_at: '2024-09-28T08:45:00Z',
        updated_at: '2024-10-20T11:00:00Z',
      },
      platform_id: 1,
      platform: { id: 1, name: 'Meta Ads', slug: 'meta', is_active: true },
      name: 'Marketing Course - Entrepreneurs',
      status: 'paused',
      daily_budget: 200,
      total_budget: 6000,
      target_roas: 2.0,
      start_date: '2024-10-10T00:00:00Z',
      created_at: '2024-10-08T11:30:00Z',
      updated_at: '2024-10-25T16:45:00Z',
      spend: 2850,
      revenue: 3990,
      profit: 1140,
      roas: 1.4,
      clicks: 4123,
      conversions: 42,
      health_status: 'poor',
    },
  ]);

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      label: 'Campaign',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">
            {row.offer?.name} • {row.platform?.name}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'daily_budget',
      label: 'Daily Budget',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'spend',
      label: 'Spend',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-success-600">
          {formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'roas',
      label: 'ROAS',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value?.toFixed(2) || '0.00'}x</span>
          {value && row.target_roas && (
            <>
              {value >= row.target_roas ? (
                <TrendingUp className="h-4 w-4 text-success-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-600" />
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: 'conversions',
      label: 'Conversions',
      sortable: true,
      render: (value) => value?.toLocaleString() || '0',
    },
    {
      key: 'health_status',
      label: 'Health',
      sortable: true,
      render: (value) => <StatusBadge status={value || 'unknown'} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => formatDate(value),
    },
  ];

  return (
    <div>
      <Header
        title="Campaigns"
        subtitle="Manage and monitor your advertising campaigns"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Platforms</option>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
            </select>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Health</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Campaigns</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">47</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="mt-1 text-2xl font-bold text-success-600">32</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Spend</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">$18.5K</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="mt-1 text-2xl font-bold text-success-600">$47.8K</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Avg. ROAS</div>
            <div className="mt-1 text-2xl font-bold text-primary-600">2.58x</div>
          </div>
        </div>

        {/* Health Alerts */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-warning-800">
                1 campaign needs attention
              </h3>
              <p className="mt-1 text-sm text-warning-700">
                "Marketing Course - Entrepreneurs" has ROAS below target (1.4x vs 2.0x target)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                View Details
              </Button>
              <Button size="sm">
                <Pause className="h-4 w-4 mr-1" />
                Pause Campaign
              </Button>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={campaigns}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => console.log('Clicked campaign:', row)}
          />
        </div>
      </div>
    </div>
  );
}

