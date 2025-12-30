'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ThumbsUp, ThumbsDown, ExternalLink, TrendingUp, Target, Users, DollarSign, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { formatCurrency } from '@/lib/utils';
import { discoveryProductsApi, Product, ProductFilters } from '@/lib/api/products';

export default function DiscoveryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    stage: 'discovery',
    sort_by: 'overall_score',
    sort_order: 'desc',
    page: 1,
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const platformsRes = await discoveryProductsApi.getPlatforms();
      setPlatforms(platformsRes.platforms || []);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await discoveryProductsApi.getAll({
        ...filters,
        search: searchTerm || undefined
      });
      setProducts(response.products || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handlePromote = async (product: Product) => {
    try {
      await discoveryProductsApi.promote(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setTotal(prev => prev - 1);
      setSelectedProduct(null);
      alert(`"${product.name}" promoted to Offers!`);
    } catch (err: any) {
      console.error('Error promoting product:', err);
      alert('Failed to promote product: ' + err.message);
    }
  };

  const handleArchive = async (product: Product) => {
    try {
      await discoveryProductsApi.archive(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setTotal(prev => prev - 1);
      setSelectedProduct(null);
    } catch (err: any) {
      console.error('Error archiving product:', err);
      alert('Failed to archive product: ' + err.message);
    }
  };

  const handleDeepAnalysis = async (product: Product) => {
    setIsAnalyzing(true);
    try {
      await discoveryProductsApi.deepAnalysis(product.id);
      // Refresh the selected product with analysis data
      const updated = await discoveryProductsApi.getById(product.id);
      setSelectedProduct(updated.product);
      // Also update in the list
      setProducts(prev => prev.map(p => p.id === product.id ? updated.product : p));
    } catch (err: any) {
      console.error('Error analyzing product:', err);
      alert('Analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 70) return 'text-success-600';
    if (score >= 40) return 'text-warning-600';
    return 'text-error-600';
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return 'bg-gray-100';
    if (score >= 70) return 'bg-success-50';
    if (score >= 40) return 'bg-warning-50';
    return 'bg-error-50';
  };

  const ScoreBar = ({ label, score }: { label: string; score: number | null }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{score ?? '-'}/100</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            (score || 0) >= 70 ? 'bg-success-500' : (score || 0) >= 40 ? 'bg-warning-500' : 'bg-error-500'
          }`}
          style={{ width: `${score || 0}%` }}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Header
        title="Discovery Workbench"
        subtitle="Core #1: Offer Intelligence Engine - AI-discovered products ready for promotion"
      />

      <div className="p-6 space-y-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search products..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <select
              value={filters.platform || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value || undefined, page: 1 }))}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Platforms</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filters.sort_by || 'overall_score'}
              onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value, page: 1 }))}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="overall_score">Sort by Score</option>
              <option value="temperature">Sort by Temperature</option>
              <option value="price">Sort by Price</option>
              <option value="scraped_at">Sort by Date</option>
            </select>

            <select
              value={`${filters.min_score || ''}-${filters.max_score || ''}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(v => v ? parseInt(v) : undefined);
                setFilters(prev => ({ ...prev, min_score: min, max_score: max, page: 1 }));
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="-">All Scores</option>
              <option value="70-100">High (70-100)</option>
              <option value="40-69">Medium (40-69)</option>
              <option value="0-39">Low (0-39)</option>
            </select>

            <Button onClick={handleSearch} variant="secondary" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{total} products in discovery</span>
          <span>Page {filters.page} of {totalPages}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-800">
            Error loading products: {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            Loading products...
          </div>
        )}

        {/* Products List */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Grid */}
            <div className="lg:col-span-2 space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-start gap-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreBg(product.overall_score)} ${getScoreColor(product.overall_score)}`}>
                          {product.overall_score || '-'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 mb-2 text-sm">
                        <span className="text-gray-600">{product.platform || 'Unknown'}</span>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(product.price || 0, product.currency)}
                        </span>
                        {product.temperature && (
                          <span className="text-orange-600 flex items-center gap-1">
                            🔥 {product.temperature}°
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {product.description || 'No description available'}
                      </p>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromote(product);
                          }}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Promote
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(product);
                          }}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Archive
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

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              {selectedProduct ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                    <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="mb-6">
                    {selectedProduct.image_url && (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h4 className="font-medium text-gray-900 mb-2">{selectedProduct.name}</h4>
                    <div className="flex items-center gap-3 mb-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 rounded">{selectedProduct.platform}</span>
                      <span className="font-medium">{formatCurrency(selectedProduct.price || 0, selectedProduct.currency)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                  </div>

                  {/* AI Scores */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary-600" />
                      AI Scores
                    </h5>
                    <div className="space-y-3">
                      <ScoreBar label="Demand" score={selectedProduct.demand_score} />
                      <ScoreBar label="Description" score={selectedProduct.description_score} />
                      <ScoreBar label="Price Point" score={selectedProduct.price_score} />
                      <ScoreBar label="Niche" score={selectedProduct.niche_score} />
                      <ScoreBar label="Competition" score={selectedProduct.competition_score} />
                      <ScoreBar label="Visual" score={selectedProduct.visual_score} />
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <span className="text-gray-700 font-medium">Overall Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(selectedProduct.overall_score)}`}>
                        {selectedProduct.overall_score || '-'}/100
                      </span>
                    </div>
                  </div>

                  {/* Deep Analysis Button */}
                  <div className="mb-6">
                    <Button
                      onClick={() => handleDeepAnalysis(selectedProduct)}
                      disabled={isAnalyzing}
                      variant="secondary"
                      fullWidth
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isAnalyzing ? 'Analyzing...' : 'Run Deep Analysis'}
                    </Button>
                  </div>

                  {/* Analysis Results */}
                  {(selectedProduct.promotion_summary || selectedProduct.target_audience) && (
                    <div className="space-y-4 mb-6">
                      {selectedProduct.promotion_summary && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Summary</h5>
                          <p className="text-sm text-gray-600">{selectedProduct.promotion_summary}</p>
                        </div>
                      )}
                      {selectedProduct.target_audience && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            Target Audience
                          </h5>
                          <p className="text-sm text-gray-600">{selectedProduct.target_audience}</p>
                        </div>
                      )}
                      {selectedProduct.promotion_strategy && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-600" />
                            Promotion Strategy
                          </h5>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{selectedProduct.promotion_strategy}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={() => handlePromote(selectedProduct)} fullWidth>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Promote to Offers
                    </Button>
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

        {/* Empty State */}
        {!loading && products.length === 0 && !error && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products in discovery</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add a marketplace and run a scrape to discover products
            </p>
            <Button onClick={() => window.location.href = '/integrations'}>
              Go to Integrations
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
              disabled={filters.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {filters.page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
              disabled={(filters.page || 1) >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
