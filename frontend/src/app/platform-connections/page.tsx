"use client";

import { useState, useEffect } from 'react';

interface Platform {
  id: string;
  name: string;
  logo: string;
  loginUrl: string;
  status: 'disconnected' | 'connected' | 'expired';
  lastConnected?: string;
  productsScraped?: number;
}

export default function PlatformConnectionsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'hotmart',
      name: 'Hotmart',
      logo: '🔥',
      loginUrl: 'https://sso.hotmart.com/login',
      status: 'disconnected',
      productsScraped: 152
    },
    {
      id: 'clickbank',
      name: 'ClickBank',
      logo: '💰',
      loginUrl: 'https://accounts.clickbank.com/login',
      status: 'disconnected'
    },
    {
      id: 'jvzoo',
      name: 'JVZoo',
      logo: '🦘',
      loginUrl: 'https://www.jvzoo.com/login',
      status: 'disconnected'
    },
    {
      id: 'warriorplus',
      name: 'Warrior Plus',
      logo: '⚔️',
      loginUrl: 'https://warriorplus.com/login',
      status: 'disconnected'
    },
    {
      id: 'impact',
      name: 'Impact',
      logo: '📊',
      loginUrl: 'https://app.impact.com/login',
      status: 'disconnected'
    },
    {
      id: 'cj',
      name: 'CJ Affiliate',
      logo: '🔗',
      loginUrl: 'https://members.cj.com/member/login',
      status: 'disconnected'
    },
    {
      id: 'shareasale',
      name: 'ShareASale',
      logo: '🤝',
      loginUrl: 'https://account.shareasale.com/a-login.cfm',
      status: 'disconnected'
    },
    {
      id: 'rakuten',
      name: 'Rakuten',
      logo: '🛍️',
      loginUrl: 'https://rakutenadvertising.com/login',
      status: 'disconnected'
    },
    {
      id: 'awin',
      name: 'Awin',
      logo: '🌐',
      loginUrl: 'https://ui.awin.com/awin-ui/login',
      status: 'disconnected'
    },
    {
      id: 'digistore24',
      name: 'Digistore24',
      logo: '💳',
      loginUrl: 'https://www.digistore24.com/login',
      status: 'disconnected'
    }
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (platform: Platform) => {
    setSelectedPlatform(platform);
    setIsConnecting(true);

    try {
      // Call backend API to initiate login flow
      const response = await fetch('/api/platform-connections/initiate-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId: platform.id })
      });

      const data = await response.json();

      if (data.success) {
        // Open browser window for manual login
        window.open(data.loginUrl, '_blank', 'width=800,height=600');
        
        // Poll for connection status
        pollConnectionStatus(platform.id);
      }
    } catch (error) {
      console.error('Error initiating login:', error);
      setIsConnecting(false);
    }
  };

  const pollConnectionStatus = (platformId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/platform-connections/status/${platformId}`);
        const data = await response.json();

        if (data.status === 'connected') {
          clearInterval(interval);
          
          // Update platform status
          setPlatforms(prev => prev.map(p => 
            p.id === platformId 
              ? { ...p, status: 'connected', lastConnected: new Date().toISOString() }
              : p
          ));
          
          setIsConnecting(false);
          setSelectedPlatform(null);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setIsConnecting(false);
    }, 300000);
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await fetch(`/api/platform-connections/disconnect/${platformId}`, {
        method: 'POST'
      });

      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, status: 'disconnected', lastConnected: undefined }
          : p
      ));
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const handleScrape = async (platformId: string) => {
    try {
      const response = await fetch('/api/platform-connections/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Scraping started! This will run in the background.`);
      }
    } catch (error) {
      console.error('Error starting scrape:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'expired': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'expired': return 'Session Expired';
      default: return 'Not Connected';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Connections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect to affiliate networks to scrape products with full commission data
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Platforms</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{platforms.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Connected</div>
            <div className="text-3xl font-bold text-green-600">
              {platforms.filter(p => p.status === 'connected').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Products Scraped</div>
            <div className="text-3xl font-bold text-blue-600">
              {platforms.reduce((sum, p) => sum + (p.productsScraped || 0), 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expired Sessions</div>
            <div className="text-3xl font-bold text-yellow-600">
              {platforms.filter(p => p.status === 'expired').length}
            </div>
          </div>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{platform.logo}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {platform.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(platform.status)}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getStatusText(platform.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Info */}
              {platform.lastConnected && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Last connected: {new Date(platform.lastConnected).toLocaleDateString()}
                </div>
              )}
              {platform.productsScraped !== undefined && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Products scraped: {platform.productsScraped}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {platform.status === 'connected' ? (
                  <>
                    <button
                      onClick={() => handleScrape(platform.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Scrape Now
                    </button>
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    disabled={isConnecting && selectedPlatform?.id === platform.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isConnecting && selectedPlatform?.id === platform.id ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
            How to Connect Platforms
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Click "Connect" on any platform</li>
            <li>A new browser window will open to the platform's login page</li>
            <li>Log in manually with your credentials (including 2FA if required)</li>
            <li>The system will automatically detect when you're logged in and save the session</li>
            <li>Once connected, click "Scrape Now" to fetch products with full commission data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
