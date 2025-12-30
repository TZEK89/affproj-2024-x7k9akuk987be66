// frontend/src/components/marketplace/AddMarketplaceModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { X, Globe, Settings2, Zap } from 'lucide-react';
import Button from '@/components/Button';
import {
  marketplacesApi,
  PlatformPreset,
  ScraperType,
  MarketplaceCreateData,
  Marketplace,
} from '@/lib/api/marketplaces';

interface AddMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (marketplace: Marketplace) => void;
  editMarketplace?: Marketplace | null;
}

export default function AddMarketplaceModal({
  isOpen,
  onClose,
  onSuccess,
  editMarketplace,
}: AddMarketplaceModalProps) {
  const [presets, setPresets] = useState<Record<string, PlatformPreset>>({});
  const [scraperTypes, setScraperTypes] = useState<ScraperType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [formData, setFormData] = useState<MarketplaceCreateData>({
    platform: '',
    name: '',
    base_url: '',
    language: 'en',
    category_filter: '',
    scraper_type: 'playwright',
    max_products: 100,
  });

  const isEditMode = !!editMarketplace;

  // Load presets and scraper types
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [presetsRes, typesRes] = await Promise.all([
          marketplacesApi.getPresets(),
          marketplacesApi.getScraperTypes(),
        ]);
        setPresets(presetsRes.presets || {});
        setScraperTypes(typesRes.types || []);
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  // Populate form for edit mode
  useEffect(() => {
    if (editMarketplace) {
      setSelectedPlatform(editMarketplace.platform);
      setFormData({
        platform: editMarketplace.platform,
        name: editMarketplace.name,
        base_url: editMarketplace.base_url,
        language: editMarketplace.language || 'en',
        category_filter: editMarketplace.category_filter || '',
        scraper_type: editMarketplace.scraper_type,
        max_products: 100,
      });
    } else {
      setSelectedPlatform('');
      setFormData({
        platform: '',
        name: '',
        base_url: '',
        language: 'en',
        category_filter: '',
        scraper_type: 'playwright',
        max_products: 100,
      });
    }
  }, [editMarketplace, isOpen]);

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = presets[presetId];
    if (preset) {
      setSelectedPlatform(presetId);
      setFormData({
        ...formData,
        platform: presetId,
        name: preset.name,
        base_url: preset.baseUrl,
        language: preset.languages[0] || 'en',
        scraper_type: preset.defaultScraperType,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let result;
      if (isEditMode && editMarketplace) {
        result = await marketplacesApi.update(editMarketplace.id, formData);
      } else {
        result = await marketplacesApi.create(formData);
      }
      onSuccess(result.marketplace);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save marketplace');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedPreset = presets[selectedPlatform];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Marketplace' : 'Add Public Marketplace'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-6">
              {/* Platform Selection */}
              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Platform
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(presets).map(([id, preset]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handlePresetSelect(id)}
                        className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                          selectedPlatform === id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-3xl mb-2">{preset.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                      </button>
                    ))}
                    {/* Custom option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlatform('custom');
                        setFormData({
                          ...formData,
                          platform: 'custom',
                          name: '',
                          base_url: '',
                        });
                      }}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                        selectedPlatform === 'custom'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Globe className="h-8 w-8 mb-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Custom</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              {(selectedPlatform || isEditMode) && (
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="My Hotmart Connection"
                      required
                    />
                  </div>

                  {/* Base URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marketplace URL
                    </label>
                    <input
                      type="url"
                      value={formData.base_url}
                      onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="https://hotmart.com/marketplace"
                      required
                    />
                  </div>

                  {/* Language & Category Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {selectedPreset?.languages?.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang.toUpperCase()}
                          </option>
                        )) || (
                          <>
                            <option value="en">EN</option>
                            <option value="es">ES</option>
                            <option value="pt">PT</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Filter (optional)
                      </label>
                      <select
                        value={formData.category_filter}
                        onChange={(e) => setFormData({ ...formData, category_filter: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">All Categories</option>
                        {selectedPreset?.categories?.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scraper Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Settings2 className="h-4 w-4 inline mr-2" />
                      Scraper Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {scraperTypes.map((scraper) => (
                        <button
                          key={scraper.type}
                          type="button"
                          disabled={!scraper.available}
                          onClick={() => setFormData({ ...formData, scraper_type: scraper.type })}
                          className={`flex items-start p-3 rounded-lg border-2 text-left transition-all ${
                            formData.scraper_type === scraper.type
                              ? 'border-primary-500 bg-primary-50'
                              : scraper.available
                              ? 'border-gray-200 hover:border-gray-300'
                              : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{scraper.name}</span>
                              {scraper.comingSoon && (
                                <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  Soon
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{scraper.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Products */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Products per Scrape
                    </label>
                    <input
                      type="number"
                      value={formData.max_products}
                      onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value) || 100 })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      min={10}
                      max={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Limit the number of products scraped per session (10-1000)
                    </p>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!selectedPlatform && !isEditMode}
                isLoading={isLoading}
              >
                <Zap className="h-4 w-4 mr-2" />
                {isEditMode ? 'Save Changes' : 'Add Marketplace'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
