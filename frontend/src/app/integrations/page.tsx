'use client';

import { useState } from 'react';
import { Check, X, RefreshCw, Settings, ExternalLink, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';

interface Integration {
  id: string;
  name: string;
  category: 'affiliate' | 'ads' | 'ai' | 'tools';
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  logo: string;
  lastSync?: string;
  features: string[];
  setupUrl?: string;
}

export default function IntegrationsPage() {
  const [integrations] = useState<Integration[]>([
    // Affiliate Networks
    {
      id: 'clickbank',
      name: 'ClickBank',
      category: 'affiliate',
      description: 'Leading affiliate marketplace for digital products',
      status: 'connected',
      logo: '🏦',
      lastSync: '2024-10-29T08:30:00Z',
      features: ['Offer sync', 'Commission tracking', 'Performance reports'],
      setupUrl: 'https://clickbank.com/api',
    },
    {
      id: 'shareasale',
      name: 'ShareASale',
      category: 'affiliate',
      description: 'Affiliate marketing network with 25+ years of experience',
      status: 'connected',
      logo: '💼',
      lastSync: '2024-10-29T07:15:00Z',
      features: ['Offer sync', 'Real-time tracking', 'Payment processing'],
      setupUrl: 'https://shareasale.com/api',
    },
    {
      id: 'cj',
      name: 'CJ Affiliate',
      category: 'affiliate',
      description: 'Commission Junction - Global affiliate marketing network',
      status: 'disconnected',
      logo: '🌐',
      features: ['Offer sync', 'Deep linking', 'Advanced reporting'],
      setupUrl: 'https://cj.com/api',
    },
    {
      id: 'impact',
      name: 'Impact',
      category: 'affiliate',
      description: 'Partnership automation platform',
      status: 'disconnected',
      logo: '⚡',
      features: ['Offer management', 'Attribution tracking', 'Fraud detection'],
      setupUrl: 'https://impact.com/api',
    },

    // Ad Platforms
    {
      id: 'meta',
      name: 'Meta Ads',
      category: 'ads',
      description: 'Facebook and Instagram advertising platform',
      status: 'connected',
      logo: '📘',
      lastSync: '2024-10-29T09:00:00Z',
      features: ['Campaign management', 'Performance tracking', 'Audience targeting'],
      setupUrl: 'https://developers.facebook.com',
    },
    {
      id: 'google',
      name: 'Google Ads',
      category: 'ads',
      description: 'Google advertising platform',
      status: 'connected',
      logo: '🔍',
      lastSync: '2024-10-29T08:45:00Z',
      features: ['Search ads', 'Display ads', 'Performance tracking'],
      setupUrl: 'https://developers.google.com/google-ads',
    },
    {
      id: 'tiktok',
      name: 'TikTok Ads',
      category: 'ads',
      description: 'TikTok advertising platform',
      status: 'error',
      logo: '🎵',
      lastSync: '2024-10-28T14:20:00Z',
      features: ['Video ads', 'In-feed ads', 'Brand takeovers'],
      setupUrl: 'https://ads.tiktok.com/marketing_api',
    },

    // AI Services
    {
      id: 'claude',
      name: 'Claude (Anthropic)',
      category: 'ai',
      description: 'AI assistant for content generation',
      status: 'connected',
      logo: '🤖',
      lastSync: '2024-10-29T09:30:00Z',
      features: ['Ad copy generation', 'Content writing', 'Strategy suggestions'],
      setupUrl: 'https://anthropic.com/api',
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      category: 'ai',
      description: 'AI image generation',
      status: 'connected',
      logo: '🎨',
      lastSync: '2024-10-29T08:00:00Z',
      features: ['Image generation', 'Style variations', 'Upscaling'],
      setupUrl: 'https://midjourney.com/api',
    },
    {
      id: 'runway',
      name: 'Runway Gen-3',
      category: 'ai',
      description: 'AI video generation',
      status: 'connected',
      logo: '🎬',
      lastSync: '2024-10-29T07:30:00Z',
      features: ['Video generation', 'Video editing', 'Motion graphics'],
      setupUrl: 'https://runwayml.com/api',
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      category: 'ai',
      description: 'AI voice generation',
      status: 'disconnected',
      logo: '🎙️',
      features: ['Voice synthesis', 'Voice cloning', 'Multiple languages'],
      setupUrl: 'https://elevenlabs.io/api',
    },

    // Tools
    {
      id: 'supabase',
      name: 'Supabase',
      category: 'tools',
      description: 'PostgreSQL database and backend services',
      status: 'connected',
      logo: '🗄️',
      lastSync: '2024-10-29T09:30:00Z',
      features: ['Database', 'Authentication', 'Real-time subscriptions'],
      setupUrl: 'https://supabase.com',
    },
    {
      id: 'n8n',
      name: 'n8n',
      category: 'tools',
      description: 'Workflow automation platform',
      status: 'connected',
      logo: '🔄',
      lastSync: '2024-10-29T09:15:00Z',
      features: ['Workflow automation', 'API integrations', 'Scheduled tasks'],
      setupUrl: 'https://n8n.io',
    },
  ]);

  const categories = [
    { id: 'affiliate', name: 'Affiliate Networks', icon: '💼' },
    { id: 'ads', name: 'Ad Platforms', icon: '📢' },
    { id: 'ai', name: 'AI Services', icon: '🤖' },
    { id: 'tools', name: 'Tools & Services', icon: '🛠️' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-success-600 bg-success-50';
      case 'disconnected':
        return 'text-gray-600 bg-gray-50';
      case 'error':
        return 'text-danger-600 bg-danger-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="h-4 w-4" />;
      case 'disconnected':
        return <X className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  return (
    <div>
      <Header
        title="Integrations"
        subtitle="Manage connections to external services"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Integrations</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{integrations.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Connected</div>
            <div className="mt-1 text-2xl font-bold text-success-600">{connectedCount}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Disconnected</div>
            <div className="mt-1 text-2xl font-bold text-gray-600">
              {integrations.length - connectedCount - errorCount}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Errors</div>
            <div className="mt-1 text-2xl font-bold text-danger-600">{errorCount}</div>
          </div>
        </div>

        {/* Error Alert */}
        {errorCount > 0 && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-danger-800">
                  {errorCount} integration{errorCount > 1 ? 's' : ''} need{errorCount === 1 ? 's' : ''} attention
                </h3>
                <p className="mt-1 text-sm text-danger-700">
                  Some integrations are experiencing connection issues. Please check your API keys and reconnect.
                </p>
              </div>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Integrations by Category */}
        {categories.map(category => {
          const categoryIntegrations = integrations.filter(i => i.category === category.id);
          
          return (
            <div key={category.id} className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <span className="text-sm text-gray-500">
                    ({categoryIntegrations.filter(i => i.status === 'connected').length}/{categoryIntegrations.length} connected)
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {categoryIntegrations.map(integration => (
                  <div key={integration.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      {/* Integration Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">{integration.logo}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{integration.name}</h4>
                            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                              {getStatusIcon(integration.status)}
                              <span className="capitalize">{integration.status}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                          
                          {/* Features */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {integration.features.map(feature => (
                              <span
                                key={feature}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>

                          {/* Last Sync */}
                          {integration.lastSync && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <RefreshCw className="h-3 w-3" />
                              Last synced: {new Date(integration.lastSync).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {integration.status === 'connected' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => console.log('Sync:', integration)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Sync
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => console.log('Settings:', integration)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Settings
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => console.log('Disconnect:', integration)}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <>
                            {integration.setupUrl && (
                              <a
                                href={integration.setupUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                              >
                                Setup Guide
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <Button
                              size="sm"
                              onClick={() => console.log('Connect:', integration)}
                            >
                              Connect
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* API Keys Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage your API keys and credentials for external services. Keys are encrypted and stored securely.
          </p>
          <Button variant="secondary">
            <Settings className="h-4 w-4 mr-2" />
            Manage API Keys
          </Button>
        </div>
      </div>
    </div>
  );
}

