'use client';

import { useState, useEffect } from 'react';
import { Check, X, RefreshCw, Settings, ExternalLink, AlertCircle, Download, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { integrationsApi } from '@/lib/api-service';

interface Integration {
  id: string;
  name: string;
  category: 'affiliate' | 'ads' | 'ai' | 'tools';
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  logo: string;
  lastSync?: string;
  totalProducts?: number;
  features: string[];
  setupUrl?: string;
}

interface SyncStats {
  catalogsProcessed: number;
  productsAdded: number;
  productsUpdated: number;
  productsSkipped: number;
  errors: any[];
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Load Impact.com status on mount
  useEffect(() => {
    loadImpactStatus();
  }, []);

  const loadImpactStatus = async () => {
    try {
      const status = await integrationsApi.getImpactStatus().catch(() => ({
        isConnected: false,
        lastSyncTime: null,
        totalProducts: 0
      }));
      
      const impactIntegration: Integration = {
        id: 'impact',
        name: 'Impact.com',
        category: 'affiliate',
        description: 'Enterprise affiliate marketing platform with best-in-class API',
        status: status.isConnected ? 'connected' : 'disconnected',
        logo: '⭐',
        lastSync: status.lastSyncTime,
        totalProducts: status.totalProducts,
        features: ['Offer sync', 'Real-time tracking', 'GraphQL API', 'Webhook support'],
        setupUrl: 'https://impact.com',
      };

      // Load Hotmart status
      const hotmartStatus = await integrationsApi.getHotmartStatus().catch(() => ({
        isConnected: false,
        lastSyncTime: null,
        totalProducts: 0
      }));

      const hotmartIntegration: Integration = {
        id: 'hotmart',
        name: 'Hotmart',
        category: 'affiliate',
        description: 'Digital products marketplace with instant approval',
        status: hotmartStatus.isConnected ? 'connected' : 'disconnected',
        logo: '🔥',
        lastSync: hotmartStatus.lastSyncTime,
        totalProducts: hotmartStatus.totalProducts,
        features: ['Instant approval', 'Digital products', 'AI-generated images', 'Global marketplace'],
        setupUrl: 'https://hotmart.com',
      };

      setIntegrations([
        impactIntegration,
        hotmartIntegration,
        {
          id: 'cj',
          name: 'CJ Affiliate',
          category: 'affiliate',
          description: 'Commission Junction - Global affiliate marketing network',
          status: 'disconnected',
          logo: '💼',
          features: ['Offer sync', 'Commission tracking', 'Deep linking'],
          setupUrl: 'https://cj.com',
        },
        {
          id: 'shareasale',
          name: 'ShareASale',
          category: 'affiliate',
          description: 'Affiliate marketing network with 25+ years of experience',
          status: 'disconnected',
          logo: '🤝',
          features: ['Offer sync', 'Real-time tracking', 'Payment processing'],
          setupUrl: 'https://shareasale.com',
        },
        {
          id: 'meta',
          name: 'Meta Ads',
          category: 'ads',
          description: 'Facebook and Instagram advertising platform',
          status: 'disconnected',
          logo: '📘',
          features: ['Campaign management', 'Audience targeting', 'Performance analytics'],
          setupUrl: 'https://business.facebook.com',
        },
        {
          id: 'google-ads',
          name: 'Google Ads',
          category: 'ads',
          description: 'Google advertising platform',
          status: 'disconnected',
          logo: '🔍',
          features: ['Search ads', 'Display ads', 'Shopping campaigns'],
          setupUrl: 'https://ads.google.com',
        },
        {
          id: 'dalle',
          name: 'DALL-E 3',
          category: 'ai',
          description: 'AI image generation for ad creatives',
          status: 'disconnected',
          logo: '🎨',
          features: ['Image generation', 'Ad creative creation', 'Custom styles'],
          setupUrl: 'https://openai.com',
        },
        {
          id: 'claude',
          name: 'Claude AI',
          category: 'ai',
          description: 'AI copywriting for landing pages and ads',
          status: 'disconnected',
          logo: '✍️',
          features: ['Copywriting', 'Content generation', 'A/B test variants'],
          setupUrl: 'https://anthropic.com',
        },
      ]);
    } catch (error) {
      console.error('Error loading integrations status:', error);
      // Set default integrations even if API fails
      setIntegrations([
        {
          id: 'hotmart',
          name: 'Hotmart',
          category: 'affiliate',
          description: 'Digital products marketplace with instant approval',
          status: 'disconnected',
          logo: '🔥',
          features: ['Instant approval', 'Digital products', 'AI-generated images', 'Global marketplace'],
          setupUrl: 'https://hotmart.com',
        },
        {
          id: 'impact',
          name: 'Impact.com',
          category: 'affiliate',
          description: 'Enterprise affiliate marketing platform with best-in-class API',
          status: 'disconnected',
          logo: '⭐',
          features: ['Offer sync', 'Real-time tracking', 'GraphQL API', 'Webhook support'],
          setupUrl: 'https://impact.com',
        },
        {
          id: 'cj',
          name: 'CJ Affiliate',
          category: 'affiliate',
          description: 'Commission Junction - Global affiliate marketing network',
          status: 'disconnected',
          logo: '💼',
          features: ['Offer sync', 'Commission tracking', 'Deep linking'],
          setupUrl: 'https://cj.com',
        },
        {
          id: 'shareasale',
          name: 'ShareASale',
          category: 'affiliate',
          description: 'Affiliate marketing network with 25+ years of experience',
          status: 'disconnected',
          logo: '🤝',
          features: ['Offer sync', 'Real-time tracking', 'Payment processing'],
          setupUrl: 'https://shareasale.com',
        },
        {
          id: 'meta',
          name: 'Meta Ads',
          category: 'ads',
          description: 'Facebook and Instagram advertising platform',
          status: 'disconnected',
          logo: '📘',
          features: ['Campaign management', 'Audience targeting', 'Performance analytics'],
          setupUrl: 'https://business.facebook.com',
        },
        {
          id: 'google-ads',
          name: 'Google Ads',
          category: 'ads',
          description: 'Google advertising platform',
          status: 'disconnected',
          logo: '🔍',
          features: ['Search ads', 'Display ads', 'Shopping campaigns'],
          setupUrl: 'https://ads.google.com',
        },
        {
          id: 'manus',
          name: 'Manus AI',
          category: 'ai',
          description: 'Multi-AI platform with image generation, content creation, and chat',
          status: 'disconnected',
          logo: '🤖',
          features: ['Image generation', 'Content creation', 'Data analysis', 'AI chat assistant'],
          setupUrl: 'https://manus.im',
        },
        {
          id: 'dalle',
          name: 'DALL-E 3',
          category: 'ai',
          description: 'AI image generation for ad creatives',
          status: 'disconnected',
          logo: '🎨',
          features: ['Image generation', 'Ad creative creation', 'Custom styles'],
          setupUrl: 'https://openai.com',
        },
      ]);
    }
  };

  const handleSyncImpact = async () => {
    setIsSyncing(true);
    setSyncMessage('Starting sync...');
    setSyncStats(null);

    try {
      // Start the sync
      await integrationsApi.syncImpact({
        fullSync: true,
        inStockOnly: true,
        requireImage: true,
      });

      setSyncMessage('Sync in progress... This may take a few minutes.');

      // Poll for sync status
      const pollInterval = setInterval(async () => {
        try {
          const status = await integrationsApi.getImpactSyncStatus();
          
          if (!status.isSyncing) {
            clearInterval(pollInterval);
            setIsSyncing(false);
            setSyncMessage('Sync completed successfully!');
            
            // Reload status to get updated product count
            await loadImpactStatus();
            
            // Clear message after 5 seconds
            setTimeout(() => setSyncMessage(''), 5000);
          } else if (status.stats) {
            setSyncStats(status.stats);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsSyncing(false);
          setSyncMessage('Error checking sync status');
        }
      }, 2000); // Poll every 2 seconds

    } catch (error: any) {
      setIsSyncing(false);
      setSyncMessage(`Error: ${error.message}`);
    }
  };

  const handleSyncHotmart = async () => {
    setIsSyncing(true);
    setSyncMessage('Starting Hotmart sync with AI image generation...');
    setSyncStats(null);

    try {      const result = await integrationsApi.syncHotmart({
        generateImages: true,
        batchSize: 50
      });

      setIsSyncing(false);
      if (result.success) {
        setSyncMessage(result.message || 'Sync completed successfully!');
        await loadImpactStatus(); // Reload to update Hotmart status
      } else {
        setSyncMessage(`Error: ${result.error}`);
      }

      setTimeout(() => setSyncMessage(''), 5000);
    } catch (error: any) {
      setIsSyncing(false);
      setSyncMessage(`Error: ${error.message}`);
    }
  };

  const handleConnect = async (integrationId: string) => {
    // Navigate to the connect flow page
    window.location.href = `/connect/${integrationId}`;
  };

  const handleVerifyConnection = async (integrationId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform-connections/status/${integrationId}`);
      const data = await response.json();

      if (data.status === 'connected') {
        alert(`✅ Successfully connected to ${integrationId.toUpperCase()}!`);
        await loadImpactStatus();
      } else if (data.status === 'pending') {
        alert(`⏳ Connection still pending. Please complete the login process and try again.`);
      } else {
        alert(`❌ Not connected. Please click "Connect" and log in first.`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    if (integrationId === 'impact') {
      try {
        const result = await integrationsApi.testImpactConnection();
        if (result.success) {
          alert(`✅ Successfully connected to Impact.com!\n\nFound ${result.catalogCount} catalogs.`);
          await loadImpactStatus();
        }
      } catch (error: any) {
        alert(`❌ Failed to connect to Impact.com:\n\n${error.message}`);
      }
    } else if (integrationId === 'hotmart') {
      try {
        const result = await integrationsApi.testHotmartConnection();
        if (result.success) {
          alert(`✅ Successfully connected to Hotmart!\n\nAuthentication successful.`);
          await loadImpactStatus();
        }
      } catch (error: any) {
        alert(`❌ Failed to connect to Hotmart:\n\n${error.message}`);
      }
    } else {
      // Use the new OAuth flow for other platforms
      await handleConnect(integrationId);
    }
  };

  const categoryLabels = {
    affiliate: 'Affiliate Networks',
    ads: 'Ad Platforms',
    ai: 'AI Services',
    tools: 'Tools & Services',
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Integrations" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-2 text-gray-600">
            Connect your affiliate networks, ad platforms, and AI services
          </p>
        </div>

        {syncMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            syncMessage.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
          }`}>
            <div className="flex items-center">
              {isSyncing ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : syncMessage.includes('Error') ? (
                <AlertCircle className="w-5 h-5 mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              <span>{syncMessage}</span>
            </div>
            
            {syncStats && (
              <div className="mt-3 text-sm">
                <div>Catalogs processed: {syncStats.catalogsProcessed}</div>
                <div>Products added: {syncStats.productsAdded}</div>
                <div>Products updated: {syncStats.productsUpdated}</div>
                {syncStats.errors.length > 0 && (
                  <div className="text-red-600">Errors: {syncStats.errors.length}</div>
                )}
              </div>
            )}
          </div>
        )}

        {Object.entries(groupedIntegrations).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((integration) => (
                <div
                  key={integration.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-4xl mr-3">{integration.logo}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <StatusBadge status={integration.status} />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {integration.description}
                  </p>

                  {integration.totalProducts !== undefined && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Total Products</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {integration.totalProducts.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {integration.lastSync && (
                    <div className="text-xs text-gray-500 mb-4">
                      Last synced: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">Features:</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {integration.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    {integration.status === 'connected' && (integration.id === 'impact' || integration.id === 'hotmart') ? (
                      <Button
                        onClick={integration.id === 'impact' ? handleSyncImpact : handleSyncHotmart}
                        disabled={isSyncing}
                        className="flex-1"
                      >
                        {isSyncing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Sync Offers
                          </>
                        )}
                      </Button>
                    ) : integration.status === 'disconnected' ? (
                      <Button
                        onClick={() => handleTestConnection(integration.id)}
                        variant="secondary"
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleTestConnection(integration.id)}
                        variant="secondary"
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                    )}
                    
                    {integration.setupUrl && (
                      <Button
                        onClick={() => window.open(integration.setupUrl, '_blank')}
                        variant="secondary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
