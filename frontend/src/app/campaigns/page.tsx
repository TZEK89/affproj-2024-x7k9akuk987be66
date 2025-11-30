'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { campaignsApi } from '@/lib/api-service';

interface Campaign {
  id: string;
  name: string;
  description: string;
  product_id: string;
  landing_page_id: string;
  status: string;
  budget: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await campaignsApi.getAll();
        
        if (response.success) {
          setCampaigns(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching campaigns:', err);
        setError(err.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      label: 'Campaign',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{row.description}</div>
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
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (value) => formatCurrency(parseFloat(value)),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
      render: (value) => value ? formatDate(value) : 'Ongoing',
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => formatDate(value),
    },
  ];

  if (error) {
    return (
      <div>
        <Header
          title="Campaigns"
          subtitle="Manage and monitor your advertising campaigns"
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
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Campaigns</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? '...' : campaigns.length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="mt-1 text-2xl font-bold text-success-600">
              {loading ? '...' : campaigns.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Paused</div>
            <div className="mt-1 text-2xl font-bold text-warning-600">
              {loading ? '...' : campaigns.filter(c => c.status === 'paused').length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Budget</div>
            <div className="mt-1 text-2xl font-bold text-primary-600">
              {loading ? '...' : campaigns.length > 0
                ? formatCurrency(campaigns.reduce((sum, c) => sum + parseFloat(c.budget), 0))
                : '$0.00'}
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 mb-4">No campaigns found</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={campaigns}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => console.log('Clicked campaign:', row)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
