'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { productsApi } from '@/lib/api-service';

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
  created_at: string;
}

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const columns: Column<Product>[] = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{row.network}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, row) => `${row.currency} ${parseFloat(value).toFixed(2)}`,
    },
    {
      key: 'commission_rate',
      label: 'Commission',
      sortable: true,
      render: (value) => `${parseFloat(value).toFixed(0)}%`,
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

  if (error) {
    return (
      <div>
        <Header
          title="Offers"
          subtitle="Manage affiliate offers from all networks"
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
              <option value="impact">Impact.com</option>
              <option value="cj">CJ Affiliate</option>
              <option value="shareasale">ShareASale</option>
              <option value="hotmart">Hotmart</option>
            </select>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Categories</option>
              <option value="hosting">Web Hosting</option>
              <option value="marketing">Marketing Tools</option>
              <option value="courses">Online Courses</option>
              <option value="social">Social Media</option>
            </select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? '...' : products.length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active Products</div>
            <div className="mt-1 text-2xl font-bold text-success-600">
              {loading ? '...' : products.filter(p => p.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Avg. Commission</div>
            <div className="mt-1 text-2xl font-bold text-primary-600">
              {loading ? '...' : products.length > 0 
                ? `${(products.reduce((sum, p) => sum + parseFloat(p.commission_rate), 0) / products.length).toFixed(0)}%`
                : '0%'}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Avg. Price</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? '...' : products.length > 0
                ? `$${(products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length).toFixed(2)}`
                : '$0.00'}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => console.log('Clicked product:', row)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
