'use client';

import { useState, useEffect } from 'react';
import { Check, X, RefreshCw, Settings, ExternalLink, AlertCircle, Download, CheckCircle, Zap, TrendingUp, Shield, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { integrationsApi } from '@/lib/api-service';
import ConnectModal from '@/components/ConnectModal';

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

interface HotmartStatus {
  connected: boolean;
  status: string;
  cookieCount: number;
  expiresAt?: string;
  lastUsedAt?: string;
  needsReconnect?: boolean;
  userAgent?: string;
  locale?: string;
  timezone?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [hotmartStatus, setHotmartStatus] = useState<HotmartStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<{id: string, name: string} | null>(null);

  // Load platform statuses on mount
  useEffect(() => {
    loadPlatformStatuses();
  }, []);

  const loadPlatformStatuses = async () => {
    try {
      // Load Impact.com status
      const impactStatus = await integrationsApi.getImpactStatus().catch(() => ({
        isConnected: false,
        lastSyncTime: null,
        totalProducts: 0
      }));

      // Load Hotmart status from local-connect
      const hotmartStatusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-connect/hotmart/status`).catch(() => null);
      const hotmartData: HotmartStatus = hotmartStatusResponse ? await hotmartStatusResponse.json() : {
        connected: false,
        status: 'not_connected',
        cookieCount: 0
      };
      
      setHotmartStatus(hotmartData);

      const integrationsList: Integration[] = [
        {
          id: 'hotmart',
          name: 'Hotmart',
          category: 'affiliate',
          description: `Digital products marketplace with instant approval ${hotmartData.cookieCount > 0 ? `(${hotmartData.cookieCount} cookies saved)` : ''}`,
          status: hotmartData.connected ? 'connected' : (hotmartData.needsReconnect ? 'error' : 'disconnected'),
          logo: '🔥',
          lastSync: hotmartData.lastUsedAt,
          totalProducts: 0, // Will be populated after scraping
          features: [
            'Instant approval',
            'Digital products',
            hotmartData.connected ? `Session expires: ${hotmartData.expiresAt ? new Date(hotmartData.expiresAt).toLocaleDateString() : 'Unknown'}` : 'Not connected',
            hotmartData.needsReconnect ? '⚠️ Needs reconnect' : 'Ready to scrape'
          ],
          setupUrl: 'https://hotmart.com',
        },
        {
          id: 'impact',
          name: 'Impact.com',
          category: 'affiliate',
          description: 'Enterprise affiliate marketing platform with best-in-class API',
          status: impactStatus.isConnected ? 'connected' : 'disconnected',
          logo: '⭐',
          lastSync: impactStatus.lastSyncTime,
          totalProducts: impactStatus.totalProducts,
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
      ];

      setIntegrations(integrationsList);
    } catch (error) {
      console.error('Error loading integrations status:', error);
    }
  };

  const handleConnectHotmart = () => {
    // Open local connector instructions
    window.open('/platform-connections', '_blank');
  };

  const handleSyncHotmart = async () => {
    setIsSyncing(true);
    setSyncMessage('Starting Hotmart scrape...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-connect/hotmart/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start scrape');
      }

      const result = await response.json();
      setSyncMessage(`Scrape completed! Found ${result.productsScraped || 0} products.`);
      
      // Reload status
      await loadPlatformStatuses();
      
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (error: any) {
      setSyncMessage(`Error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncImpact = async () => {
    setIsSyncing(true);
    setSyncMessage('Starting Impact.com sync...');
    setSyncStats(null);

    try {
      await integrationsApi.syncImpact({
        fullSync: true,
        inStockOnly: true,
        requireImage: true,
      });

      setSyncMessage('Sync in progress... This may take a few minutes.');

      const pollInterval = setInterval(async () => {
        try {
          const status = await integrationsApi.getImpactSyncStatus();
          
          if (!status.isSyncing) {
            clearInterval(pollInterval);
            setIsSyncing(false);
            setSyncMessage('Sync completed successfully!');
            
            await loadPlatformStatuses();
            setTimeout(() => setSyncMessage(''), 5000);
          } else if (status.stats) {
            setSyncStats(status.stats);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsSyncing(false);
          setSyncMessage('Error checking sync status');
        }
      }, 2000);

    } catch (error: any) {
      setIsSyncing(false);
      setSyncMessage(`Error: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <X className="h-5 w-5 text-gray-400" />;
    }
  };

  const affiliateIntegrations = integrations.filter(i => i.category === 'affiliate');
  const adsIntegrations = integrations.filter(i => i.category === 'ads');

  return (
    <div>
      <Header
        title="Platform Connections"
        subtitle="Core #1: Offer Intelligence Engine - Connect affiliate platforms to source high-converting offers"
      />

      <div className="p-6 space-y-6">
        {/* Sync Status Alert */}
        {syncMessage && (
          <div className={`rounded-lg p-4 ${syncMessage.includes('Error') ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-center gap-3">
              {isSyncing ? (
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div className="flex-1">
                <p className={syncMessage.includes('Error') ? 'text-red-800' : 'text-blue-800'}>
                  {syncMessage}
                </p>
                {syncStats && (
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Processed: {syncStats.catalogsProcessed} catalogs</p>
                    <p>Added: {syncStats.productsAdded} | Updated: {syncStats.productsUpdated} | Skipped: {syncStats.productsSkipped}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hotmart Featured Card */}
        {hotmartStatus && (
          <div className="rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="text-5xl">🔥</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">Hotmart</h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(hotmartStatus.connected ? 'connected' : hotmartStatus.needsReconnect ? 'error' : 'disconnected')}`}>
                      {getStatusIcon(hotmartStatus.connected ? 'connected' : hotmartStatus.needsReconnect ? 'error' : 'disconnected')}
                      {hotmartStatus.connected ? 'Connected' : hotmartStatus.needsReconnect ? 'Needs Reconnect' : 'Not Connected'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Digital products marketplace with instant approval. Local Connect system enabled for secure authentication.
                  </p>

                  {/* Connection Details */}
                  {hotmartStatus.connected && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">
                          <strong>Cookies:</strong> {hotmartStatus.cookieCount} saved
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-700">
                          <strong>Expires:</strong> {hotmartStatus.expiresAt ? new Date(hotmartStatus.expiresAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      {hotmartStatus.userAgent && (
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <Zap className="h-4 w-4 text-purple-600" />
                          <span className="text-gray-700">
                            <strong>Fingerprint:</strong> {hotmartStatus.locale} • {hotmartStatus.timezone}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      ✓ Instant Approval
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      ✓ Digital Products
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      ✓ Session Fingerprinting
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                      ✓ Deterministic Verification
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {!hotmartStatus.connected ? (
                  <Button onClick={handleConnectHotmart} variant="primary">
                    <Zap className="h-4 w-4 mr-2" />
                    Connect Now
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSyncHotmart} disabled={isSyncing} variant="primary">
                      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                      Scrape Offers
                    </Button>
                    <Button onClick={handleConnectHotmart} variant="secondary">
                      <Settings className="h-4 w-4 mr-2" />
                      Reconnect
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Affiliate Platforms */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Affiliate Networks</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {affiliateIntegrations.filter(i => i.id !== 'hotmart').map((integration) => (
              <div
                key={integration.id}
                className="rounded-lg bg-white border border-gray-200 p-6 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{integration.logo}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                    {getStatusIcon(integration.status)}
                    {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                {/* Stats */}
                {integration.status === 'connected' && (
                  <div className="flex gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Products:</span>
                      <span className="ml-2 font-semibold text-gray-900">{integration.totalProducts || 0}</span>
                    </div>
                    {integration.lastSync && (
                      <div>
                        <span className="text-gray-500">Last Sync:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {new Date(integration.lastSync).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {integration.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button
                        onClick={() => integration.id === 'impact' && handleSyncImpact()}
                        disabled={isSyncing}
                        variant="secondary"
                        size="sm"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedPlatform({ id: integration.id, name: integration.name });
                        setConnectModalOpen(true);
                      }}
                      variant="primary"
                      size="sm"
                    >
                      Connect
                    </Button>
                  )}
                  {integration.setupUrl && (
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Platforms */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Advertising Platforms</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {adsIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="rounded-lg bg-white border border-gray-200 p-6 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{integration.logo}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                    {getStatusIcon(integration.status)}
                    Coming Soon
                  </span>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {integration.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {connectModalOpen && selectedPlatform && (
        <ConnectModal
          isOpen={connectModalOpen}
          platform={selectedPlatform.id}
          platformName={selectedPlatform.name}
          onClose={() => {
            setConnectModalOpen(false);
            setSelectedPlatform(null);
          }}
          onSuccess={() => {
            setConnectModalOpen(false);
            setSelectedPlatform(null);
            loadPlatformStatuses();
          }}
        />
      )}
    </div>
  );
}
