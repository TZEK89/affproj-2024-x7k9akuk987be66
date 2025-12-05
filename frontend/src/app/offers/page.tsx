'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Image as ImageIcon, RefreshCw, Edit } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { productsApi } from '@/lib/api-service';
import ImageManagerModal from '@/components/ImageManagerModal';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  commission_rate: string;
  category: string;
  network: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
}

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getAll();
        
        if (response.success) {
          setProducts(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    if (filter === 'active') return product.is_active;
    if (filter === 'inactive') return !product.is_active;
    return product.network === filter;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Offers" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Error loading products: {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Offers" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
            <p className="mt-2 text-gray-600">
              {filteredProducts.length} products from {[...new Set(products.map(p => p.network))].length} networks
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {['all', 'active', 'inactive', 'Impact.com', 'Hotmart', 'CJ Affiliate'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Sync products from your affiliate networks to get started.'
                : `No ${filter} products found. Try a different filter.`}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Sync Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Overlay with actions (visible on hover) */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      className="mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Change Image
                    </Button>
                  </div>

                  {/* Network badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                      {product.network}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
                      {product.name}
                    </h3>
                    <StatusBadge status={product.is_active ? 'active' : 'paused'} />
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description || 'No description available'}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-500">Price</div>
                      <div className="text-lg font-bold text-gray-900">
                        {product.currency} {parseFloat(product.price).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Commission</div>
                      <div className="text-lg font-bold text-green-600">
                        {parseFloat(product.commission_rate).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{product.category}</span>
                      <span>{formatDate(product.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Manager Modal */}
        {selectedProduct && (
          <ImageManagerModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProduct(null);
            }}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            currentImageUrl={selectedProduct.image_url}
            onImageUpdated={(newImageUrl) => {
              // Update the product in the local state
              setProducts(products.map(p =>
                p.id === selectedProduct.id
                  ? { ...p, image_url: newImageUrl }
                  : p
              ));
            }}
          />
        )}
      </main>
    </div>
  );
}
