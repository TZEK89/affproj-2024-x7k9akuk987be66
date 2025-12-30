// frontend/src/components/marketplace/MarketplaceCard.tsx

'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Settings,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  XCircle,
} from 'lucide-react';
import Button from '@/components/Button';
import { Marketplace } from '@/lib/api/marketplaces';

interface MarketplaceCardProps {
  marketplace: Marketplace;
  onScrape: (id: number) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
  onEdit: (marketplace: Marketplace) => void;
  onDelete: (id: number) => Promise<void>;
  isScraping?: boolean;
}

// Platform icons mapping
const PLATFORM_ICONS: Record<string, string> = {
  hotmart: '🔥',
  clickbank: '💰',
  jvzoo: '🚀',
  warriorplus: '⚔️',
  digistore24: '🏪',
  shareasale: '🤝',
  cj: '💼',
  custom: '🌐',
};

export default function MarketplaceCard({
  marketplace,
  onScrape,
  onCancel,
  onEdit,
  onDelete,
  isScraping = false,
}: MarketplaceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${marketplace.name}"?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(marketplace.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scraping':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scraping':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const icon = marketplace.icon_url || PLATFORM_ICONS[marketplace.platform] || PLATFORM_ICONS.custom;

  return (
    <div className="rounded-lg bg-white border border-gray-200 p-6 hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{marketplace.name}</h3>
            <p className="text-sm text-gray-600 mt-1 capitalize">{marketplace.platform}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            marketplace.status
          )}`}
        >
          {getStatusIcon(marketplace.status)}
          {marketplace.status === 'ready' ? 'Ready' : marketplace.status === 'scraping' ? 'Scraping' : 'Error'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">Products:</span>
          <span className="font-semibold text-gray-900">{marketplace.products_count || 0}</span>
        </div>
        {marketplace.last_scraped_at && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Last:</span>
            <span className="font-semibold text-gray-900">
              {new Date(marketplace.last_scraped_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {marketplace.status === 'error' && marketplace.error_message && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {marketplace.error_message}
          </p>
        </div>
      )}

      {/* Features/Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
          {marketplace.scraper_type}
        </span>
        {marketplace.language && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            {marketplace.language.toUpperCase()}
          </span>
        )}
        {marketplace.category_filter && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            {marketplace.category_filter}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {marketplace.status === 'scraping' ? (
          <Button onClick={() => onCancel(marketplace.id)} variant="danger" size="sm" disabled={isScraping}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        ) : (
          <Button
            onClick={() => onScrape(marketplace.id)}
            variant="primary"
            size="sm"
            disabled={isScraping}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScraping ? 'animate-spin' : ''}`} />
            Scrape
          </Button>
        )}
        <Button onClick={() => onEdit(marketplace)} variant="secondary" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button
          onClick={handleDelete}
          variant="ghost"
          size="sm"
          disabled={isDeleting || marketplace.status === 'scraping'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <a href={marketplace.base_url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}
