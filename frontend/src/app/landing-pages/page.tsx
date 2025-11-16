'use client';

import { useState } from 'react';
import { Plus, Filter, ExternalLink, Copy, Eye, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { LandingPage } from '@/types';
import { formatDate } from '@/lib/utils';

export default function LandingPagesPage() {
  const templates = [
    { id: 'hero-video', name: 'Hero Video', description: 'Video hero with CTA' },
    { id: 'testimonials', name: 'Testimonials', description: 'Social proof focused' },
    { id: 'long-form-sales', name: 'Long-Form Sales', description: 'Detailed sales letter' },
    { id: 'interactive-quiz', name: 'Interactive Quiz', description: 'Engagement quiz' },
    { id: 'minimal-cta', name: 'Minimal CTA', description: 'Clean, simple design' }
  ];

  const [landingPages] = useState<LandingPage[]>([
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
        updated_at: '2024-10-28T15:30:00Z'
      },
      name: 'Yoga Burn - Weight Loss Landing Page',
      url: 'https://lp.example.com/yoga-burn-weight-loss',
      template: 'hero-video',
      is_active: true,
      created_at: '2024-10-20T10:00:00Z',
      updated_at: '2024-10-28T15:30:00Z',
      views: 8234,
      conversions: 247,
      conversion_rate: 3.0
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
        updated_at: '2024-10-27T09:15:00Z'
      },
      name: 'Credit Repair - Trust Builder',
      url: 'https://lp.example.com/credit-repair-trust',
      template: 'testimonials',
      is_active: true,
      created_at: '2024-10-18T14:00:00Z',
      updated_at: '2024-10-27T09:15:00Z',
      views: 5678,
      conversions: 77,
      conversion_rate: 1.36
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
        updated_at: '2024-10-20T11:00:00Z'
      },
      name: 'Marketing Course - Sales Page',
      url: 'https://lp.example.com/marketing-mastery',
      template: 'long-form-sales',
      is_active: false,
      created_at: '2024-10-10T11:30:00Z',
      updated_at: '2024-10-20T11:00:00Z',
      views: 4123,
      conversions: 42,
      conversion_rate: 1.02
    },
    {
      id: 4,
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
        updated_at: '2024-10-28T15:30:00Z'
      },
      name: 'Yoga Burn - Quiz Funnel',
      url: 'https://lp.example.com/yoga-quiz',
      template: 'interactive-quiz',
      is_active: true,
      created_at: '2024-10-22T09:00:00Z',
      updated_at: '2024-10-28T16:00:00Z',
      views: 3456,
      conversions: 189,
      conversion_rate: 5.47
    }
  ]);

  const columns: Column<LandingPage>[] = [
    {
      key: 'name',
      label: 'Landing Page',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
            <span>{row.offer?.name}</span>
            <span>•</span>
            <span className="text-primary-600">{row.template}</span>
          </div>
        </div>
      )
    },
    {
      key: 'url',
      label: 'URL',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 truncate max-w-xs">{value}</span>
          <button
            className="text-gray-400 hover:text-primary-600"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(value);
            }}
          >
            <Copy className="h-4 w-4" />
          </button>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-primary-600"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )
    },
    {
      key: 'views',
      label: 'Views',
      sortable: true,
      render: (value) => value?.toLocaleString() || '0'
    },
    {
      key: 'conversions',
      label: 'Conversions',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-success-600">
          {value?.toLocaleString() || '0'}
        </span>
      )
    },
    {
      key: 'conversion_rate',
      label: 'Conv. Rate',
      sortable: true,
      render: (value) => {
        const rate = value || 0;
        const isGood = rate >= 2.0;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isGood ? 'text-success-600' : 'text-gray-900'}`}>
              {rate.toFixed(2)}%
            </span>
            {isGood ? (
              <TrendingUp className="h-4 w-4 text-success-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        );
      }
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value ? 'active' : 'paused'} />
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              console.log('View:', row);
            }}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Edit:', row);
            }}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete:', row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const totalViews = landingPages.reduce((sum, lp) => sum + (lp.views || 0), 0);
  const totalConversions = landingPages.reduce((sum, lp) => sum + (lp.conversions || 0), 0);
  const avgConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
  const activePages = landingPages.filter(lp => lp.is_active).length;

  return (
    <div>
      <Header
        title="Landing Pages"
        subtitle="Manage and optimize your landing pages"
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Templates</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Offers</option>
              <option value="1">Yoga Burn Challenge</option>
              <option value="2">Credit Repair Blueprint</option>
              <option value="3">Digital Marketing Mastery</option>
            </select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Landing Page
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Pages</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{landingPages.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active Pages</div>
            <div className="mt-1 text-2xl font-bold text-success-600">{activePages}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Views</div>
            <div className="mt-1 text-2xl font-bold text-primary-600">{totalViews.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Avg. Conv. Rate</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{avgConversionRate.toFixed(2)}%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Templates</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {templates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Preview</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={landingPages}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => console.log('Clicked landing page:', row)}
          />
        </div>
      </div>
    </div>
  );
}
