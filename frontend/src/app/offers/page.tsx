'use client';

import { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Users, ExternalLink, ChevronRight, X, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { formatCurrency } from '@/lib/utils';
import { discoveryProductsApi, Product } from '@/lib/api/products';

export default function OffersPage() {
  const [offers, setOffers] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Product | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const response = await discoveryProductsApi.getAll({
        stage: 'offer',
        is_promoted: true,
        sort_by: 'overall_score',
        sort_order: 'desc',
        limit: 50
      });
      setOffers(response.products || []);
      setTotal(response.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async (id: number, rate: number) => {
    try {
      const offer = offers.find(o => o.id === id);
      const amount = offer?.price ? (offer.price * rate / 100) : null;

      await discoveryProductsApi.update(id, {
        commission_rate: rate,
        commission_amount: amount
      } as Partial<Product>);

      setOffers(prev => prev.map(o =>
        o.id === id ? { ...o, commission_rate: rate, commission_amount: amount } : o
      ));
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  const handleToggleAffiliated = async (id: number, isAffiliated: boolean) => {
    try {
      await discoveryProductsApi.update(id, {
        is_affiliated: isAffiliated
      } as Partial<Product>);

      setOffers(prev => prev.map(o =>
        o.id === id ? { ...o, is_affiliated: isAffiliated } : o
      ));
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  // Calculate stats
  const avgScore = offers.length > 0
    ? Math.round(offers.reduce((sum, o) => sum + (o.overall_score || 0), 0) / offers.length)
    : 0;
  const avgCommission = offers.length > 0
    ? offers.reduce((sum, o) => sum + (o.commission_amount || 0), 0) / offers.length
    : 0;
  const affiliatedCount = offers.filter(o => o.is_affiliated).length;

  return (
    <div>
      <Header
        title="Offers"
        subtitle="Core #1: Offer Intelligence Engine - High-converting products ready for promotion"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Target className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Offers</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{avgScore}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Avg Commission</p>
                <p className="text-2xl font-bold text-gray-900">${avgCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Affiliated</p>
                <p className="text-2xl font-bold text-gray-900">{affiliatedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-800">
            Error loading offers: {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white border border-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Offers List */}
        {!loading && offers.length > 0 && (
          <div className="space-y-4">
            {offers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onSelect={() => setSelectedOffer(offer)}
                onUpdateCommission={(rate) => handleUpdateCommission(offer.id, rate)}
                onToggleAffiliated={(val) => handleToggleAffiliated(offer.id, val)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && offers.length === 0 && !error && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Offers Yet</h3>
            <p className="text-gray-600 mb-4">
              Promote products from Discovery to create offers
            </p>
            <Button onClick={() => window.location.href = '/discovery'}>
              Go to Discovery
            </Button>
          </div>
        )}

        {/* Offer Detail Modal */}
        {selectedOffer && (
          <OfferDetailModal
            offer={selectedOffer}
            onClose={() => setSelectedOffer(null)}
          />
        )}
      </div>
    </div>
  );
}

// Offer Card Component
function OfferCard({
  offer,
  onSelect,
  onUpdateCommission,
  onToggleAffiliated
}: {
  offer: Product;
  onSelect: () => void;
  onUpdateCommission: (rate: number) => void;
  onToggleAffiliated: (val: boolean) => void;
}) {
  const roi = offer.roi_projection;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        {/* Image */}
        {offer.image_url ? (
          <img
            src={offer.image_url}
            alt=""
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-8 h-8 text-gray-300" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{offer.name}</h3>
              <p className="text-gray-500 text-sm">{offer.platform} • {offer.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(offer.price || 0, offer.currency)}</p>
              <p className="text-gray-500 text-sm">
                Score: <span className="text-success-600 font-medium">{offer.overall_score}</span>
              </p>
            </div>
          </div>

          {/* Summary */}
          {offer.promotion_summary && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {offer.promotion_summary}
            </p>
          )}

          {/* ROI Projection */}
          {roi && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-gray-500">ROI Projection:</span>
              <span className="text-error-600">{roi.min}%</span>
              <span className="text-gray-400">→</span>
              <span className="text-warning-600">{roi.avg}%</span>
              <span className="text-gray-400">→</span>
              <span className="text-success-600">{roi.max}%</span>
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Commission:</span>
              <input
                type="number"
                value={offer.commission_rate || ''}
                onChange={(e) => onUpdateCommission(parseFloat(e.target.value) || 0)}
                placeholder="%"
                className="w-16 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-500 text-sm">%</span>
              {offer.commission_amount && (
                <span className="text-success-600 text-sm ml-2">
                  (${offer.commission_amount.toFixed(2)})
                </span>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={offer.is_affiliated}
                onChange={(e) => onToggleAffiliated(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-600 text-sm">Affiliated</span>
            </label>

            <button
              onClick={onSelect}
              className="ml-auto flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offer Detail Modal
function OfferDetailModal({
  offer,
  onClose
}: {
  offer: Product;
  onClose: () => void;
}) {
  const roi = offer.roi_projection;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{offer.name}</h2>
              <p className="text-gray-500">{offer.platform} • Score: {offer.overall_score}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Strategic Context */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-primary-600 font-medium mb-2">Why This Product</h3>
              <p className="text-gray-700">{offer.promotion_summary || 'No summary available'}</p>
            </div>

            {/* Target Audience */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-primary-600 font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </h3>
              <p className="text-gray-700">{offer.target_audience || 'Not defined'}</p>
            </div>

            {/* Promotion Strategy */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-primary-600 font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Promotion Strategy
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{offer.promotion_strategy || 'Not defined'}</p>
            </div>

            {/* ROI Projection */}
            {roi && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-primary-600 font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  ROI Projection
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-error-50 rounded-lg">
                    <p className="text-error-600 text-2xl font-bold">{roi.min}%</p>
                    <p className="text-gray-500 text-sm">Conservative</p>
                  </div>
                  <div className="text-center p-3 bg-warning-50 rounded-lg">
                    <p className="text-warning-600 text-2xl font-bold">{roi.avg}%</p>
                    <p className="text-gray-500 text-sm">Expected</p>
                  </div>
                  <div className="text-center p-3 bg-success-50 rounded-lg">
                    <p className="text-success-600 text-2xl font-bold">{roi.max}%</p>
                    <p className="text-gray-500 text-sm">Optimistic</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-2">Assumptions:</p>
                  <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
                    {roi.assumptions?.map((a: string, i: number) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            {offer.product_url && (
              <a
                href={offer.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="secondary" fullWidth>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Product
                </Button>
              </a>
            )}
            <Button variant="primary" fullWidth className="flex-1">
              Generate Content
            </Button>
            <Button variant="primary" fullWidth className="flex-1">
              Create Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
