'use client';

import { useState, useEffect } from 'react';
import { Filter, ThumbsUp, ThumbsDown, ExternalLink, TrendingUp, Target, Users, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { formatCurrency } from '@/lib/utils';
import { agentsApi } from '@/lib/api-service';
import { DiscoveredProduct } from '@/types/agents';

export default function DiscoveryPage() {
  const [products, setProducts] = useState<DiscoveredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<DiscoveredProduct | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [minScore]);

  const fetchProducts = async () => {
    try {
      const response = await agentsApi.getDiscoveredProducts({ minScore });
      if (response.success) {
        setProducts(response.products || []);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (productId: number) => {
    try {
      await agentsApi.promoteProduct(productId.toString());
      alert('Product promoted successfully!');
      fetchProducts();
    } catch (err: any) {
      console.error('Error promoting product:', err);
      alert('Failed to promote product: ' + err.message);
    }
  };

  const handleDismiss = async (productId: number) => {
    try {
      await agentsApi.updateDiscoveredProduct(productId.toString(), { status: 'dismissed' });
      fetchProducts();
    } catch (err: any) {
      console.error('Error dismissing product:', err);
      alert('Failed to dismiss product: ' + err.message);
    }
  };

  if (error) {
    return (
      <div>
        <Header title="Discovery Workbench" subtitle="Core #1: Offer Intelligence Engine - AI-discovered products ready for promotion" />
        <div className="p-6">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-800">
            Error loading products: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Discovery Workbench"
        subtitle="Core #1: Offer Intelligence Engine - AI-discovered products ready for promotion"
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-3 flex-1">
              <label className="text-sm font-medium text-gray-700">Min AI Score:</label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-bold text-gray-900 w-12">{minScore}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products discovered yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a research mission to discover products
            </p>
            <Button onClick={() => window.location.href = '/missions'}>
              Go to Missions
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Grid */}
            <div className="lg:col-span-2 space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-start gap-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2">{product.product_name}</h3>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {formatCurrency(product.price, product.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-success-500" />
                          <span className="text-success-600 font-medium">
                            {product.commission_rate}% ({formatCurrency(product.commission_amount, product.currency)})
                          </span>
                        </div>
                      </div>

                      {/* AI Score Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">AI Score</span>
                          <span className="text-xs font-bold text-gray-900">{product.ai_score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              product.ai_score >= 80 ? 'bg-success-600' :
                              product.ai_score >= 60 ? 'bg-warning-600' :
                              'bg-error-600'
                            }`}
                            style={{ width: `${product.ai_score}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Quick Info */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {product.ai_recommendation}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromote(product.id);
                          }}
                          disabled={product.status === 'promoted'}
                        >
                          {product.status === 'promoted' ? (
                            'Promoted'
                          ) : (
                            <>
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Promote
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(product.id);
                          }}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                        {product.product_url && (
                          <a
                            href={product.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Analysis Panel */}
            <div className="lg:col-span-1">
              {selectedProduct ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
                  
                  {/* Product Info */}
                  <div className="mb-6">
                    {selectedProduct.image_url && (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.product_name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h4 className="font-medium text-gray-900 mb-2">{selectedProduct.product_name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{selectedProduct.description}</p>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">AI Score</span>
                        <span className="text-2xl font-bold text-gray-900">{selectedProduct.ai_score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            selectedProduct.ai_score >= 80 ? 'bg-success-600' :
                            selectedProduct.ai_score >= 60 ? 'bg-warning-600' :
                            'bg-error-600'
                          }`}
                          style={{ width: `${selectedProduct.ai_score}%` }}
                        ></div>
                      </div>
                    </div>

                    {selectedProduct.estimated_conversion_rate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Est. Conversion Rate</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedProduct.estimated_conversion_rate}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Strengths */}
                  {selectedProduct.ai_strengths && selectedProduct.ai_strengths.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-success-600" />
                        Strengths
                      </h5>
                      <ul className="space-y-1">
                        {selectedProduct.ai_strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-success-600">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {selectedProduct.ai_weaknesses && selectedProduct.ai_weaknesses.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-error-600" />
                        Weaknesses
                      </h5>
                      <ul className="space-y-1">
                        {selectedProduct.ai_weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-error-600">•</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Target Audience */}
                  {selectedProduct.target_audience && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Target Audience
                      </h5>
                      <p className="text-sm text-gray-700">{selectedProduct.target_audience}</p>
                    </div>
                  )}

                  {/* Market Competition */}
                  {selectedProduct.market_competition && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        Market Competition
                      </h5>
                      <p className="text-sm text-gray-700">{selectedProduct.market_competition}</p>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-primary-900 mb-2">AI Recommendation</h5>
                    <p className="text-sm text-primary-800">{selectedProduct.ai_recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center sticky top-6">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👈</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Select a product to see detailed AI analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
