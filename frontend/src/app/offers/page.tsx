'use client';

import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Offer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OffersPage() {
  // Mock data - in production, fetch from API
  const [offers] = useState<Offer[]>([
    {
      id: 1,
      network_id: 1,
      network: { id: 1, name: 'ClickBank', slug: 'clickbank', is_active: true },
      name: 'Yoga Burn Challenge',
      description: 'Complete yoga program for weight loss',
      url: 'https://example.com/yoga-burn',
      niche: 'Health & Fitness',
      commission_type: 'percentage',
      commission_value: 75,
      epc: 2.45,
      conversion_rate: 3.2,
      refund_rate: 8.5,
      quality_score: 92,
      is_active: true,
      created_at: '2024-10-15T10:00:00Z',
      updated_at: '2024-10-28T15:30:00Z',
    },
    {
      id: 2,
      network_id: 2,
      network: { id: 2, name: 'ShareASale', slug: 'shareasale', is_active: true },
      name: 'Credit Repair Blueprint',
      description: 'Step-by-step credit repair guide',
      url: 'https://example.com/credit-repair',
      niche: 'Personal Finance',
      commission_type: 'fixed',
      commission_value: 150,
      epc: 3.12,
      conversion_rate: 2.8,
      refund_rate: 5.2,
      quality_score: 88,
      is_active: true,
      created_at: '2024-10-12T14:20:00Z',
      updated_at: '2024-10-27T09:15:00Z',
    },
    {
      id: 3,
      network_id: 1,
      network: { id: 1, name: 'ClickBank', slug: 'clickbank', is_active: true },
      name: 'Digital Marketing Mastery',
      description: 'Complete online marketing course',
      url: 'https://example.com/marketing-course',
      niche: 'Online Education',
      commission_type: 'percentage',
      commission_value: 50,
      epc: 1.85,
      conversion_rate: 4.1,
      refund_rate: 12.3,
      quality_score: 78,
      is_active: false,
      created_at: '2024-09-28T08:45:00Z',
      updated_at: '2024-10-20T11:00:00Z',
    },
  ]);

  const columns: Column<Offer>[] = [
    {
      key: 'name',
      label: 'Offer Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{row.network?.name}</div>
        </div>
      ),
    },
    {
      key: 'niche',
      label: 'Niche',
      sortable: true,
    },
    {
      key: 'commission_value',
      label: 'Commission',
      sortable: true,
      render: (value, row) =>
        row.commission_type === 'percentage'
          ? `${value}%`
          : formatCurrency(value),
    },
    {
      key: 'epc',
      label: 'EPC',
      sortable: true,
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'conversion_rate',
      label: 'Conv. Rate',
      sortable: true,
      render: (value) => `${value?.toFixed(1) || 0}%`,
    },
    {
      key: 'quality_score',
      label: 'Quality Score',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${value || 0}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge status={value ? 'active' : 'paused'} />
      ),
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
        title="Offers"
        subtitle="Manage affiliate offers from all networks"
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
              <option value="">All Networks</option>
              <option value="clickbank">ClickBank</option>
              <option value="shareasale">ShareASale</option>
              <option value="cj">CJ Affiliate</option>
              <option value="impact">Impact</option>
            </select>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Niches</option>
              <option value="health">Health & Fitness</option>
              <option value="finance">Personal Finance</option>
              <option value="education">Online Education</option>
            </select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Offer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Offers</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">247</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active Offers</div>
            <div className="mt-1 text-2xl font-bold text-success-600">189</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Avg. Quality Score</div>
            <div className="mt-1 text-2xl font-bold text-primary-600">86</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Avg. EPC</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">$2.47</div>
          </div>
        </div>

        {/* Offers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={offers}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => console.log('Clicked offer:', row)}
          />
        </div>
      </div>
    </div>
  );
}

