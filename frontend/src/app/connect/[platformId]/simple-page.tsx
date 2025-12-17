'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import Button from '@/components/Button';

const PLATFORM_CONFIGS: Record<string, {
  name: string;
  loginUrl: string;
  marketplaceUrl: string;
  icon: string;
}> = {
  hotmart: {
    name: 'Hotmart',
    loginUrl: 'https://sso.hotmart.com/login',
    marketplaceUrl: 'https://app.hotmart.com/market',
    icon: '🔥'
  },
  impact: {
    name: 'Impact.com',
    loginUrl: 'https://app.impact.com/login',
    marketplaceUrl: 'https://app.impact.com/secure/advertiser/marketplace',
    icon: '⭐'
  },
  clickbank: {
    name: 'ClickBank',
    loginUrl: 'https://accounts.clickbank.com/login',
    marketplaceUrl: 'https://accounts.clickbank.com/marketplace',
    icon: '💰'
  },
  cj: {
    name: 'CJ Affiliate',
    loginUrl: 'https://members.cj.com/member/login',
    marketplaceUrl: 'https://members.cj.com/member/publisher/searchAdvertisers.do',
    icon: '💼'
  }
};

export default function SimpleConnectPage() {
  const params = useParams();
  const router = useRouter();
  const platformId = params.platformId as string;
  const config = PLATFORM_CONFIGS[platformId];

  const [status, setStatus] = useState<'instructions' | 'waiting' | 'success' | 'error'>('instructions');
  const [message, setMessage] = useState('');
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // Bookmarklet code that captures cookies and sends to backend
  const bookmarkletCode = `javascript:(function(){
    const data = {
      platformId: '${platformId}',
      cookies: document.cookie,
      url: window.location.href,
      localStorage: JSON.stringify(localStorage),
      timestamp: new Date().toISOString()
    };
    
    fetch('${process.env.NEXT_PUBLIC_API_URL}/platform-connections/save-session', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({platformId: '${platformId}', sessionData: data})
    })
    .then(r => r.json())
    .then(result => {
      if(result.success) {
        alert('✅ Session captured successfully! You can close this tab and return to the dashboard.');
      } else {
        alert('❌ Failed to capture session: ' + (result.error || 'Unknown error'));
      }
    })
    .catch(e => alert('❌ Error: ' + e.message));
  })();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const openPlatform = () => {
    window.open(config.marketplaceUrl, '_blank');
    setStatus('waiting');
  };

  const checkConnection = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform-connections/status/${platformId}`);
      const data = await response.json();

      if (data.status === 'connected') {
        setStatus('success');
        setMessage('Connection verified successfully!');
        setTimeout(() => router.push('/integrations'), 2000);
      } else {
        setMessage('Not connected yet. Please use the bookmarklet in the platform tab.');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unknown Platform</h2>
          <p className="text-gray-600 mb-6">Platform "{platformId}" is not supported.</p>
          <Button onClick={() => router.push('/integrations')}>Back to Integrations</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">{config.icon}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Connect to {config.name}
              </h1>
              <p className="text-gray-600">
                Securely connect your account in 3 simple steps
              </p>
            </div>
          </div>

          {/* Status */}
          {status === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{message}</p>
            </div>
          )}
        </div>

        {/* Step 1: Create Bookmarklet */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create Capture Bookmarklet
              </h3>
              <p className="text-gray-600 mb-4">
                Copy the code below and save it as a bookmark in your browser. This bookmarklet will securely capture your session.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <code className="text-sm text-gray-800 break-all block mb-3">
                  {bookmarkletCode.substring(0, 100)}...
                </code>
                <Button onClick={copyBookmarklet} size="sm">
                  {copiedBookmarklet ? (
                    <><Check className="w-4 h-4 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy Bookmarklet</>
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>How to save as bookmark:</strong><br />
                  1. Copy the code above<br />
                  2. Create a new bookmark (Ctrl+D or Cmd+D)<br />
                  3. Name it "Capture {config.name} Session"<br />
                  4. Paste the code in the URL field
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Log in to Platform */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Log in to {config.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Open {config.name} and log in with your credentials. Complete any 2FA challenges if required.
              </p>
              
              <Button onClick={openPlatform}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open {config.name}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3: Capture Session */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Capture Your Session
              </h3>
              <p className="text-gray-600 mb-4">
                Once logged in, click the bookmarklet you created in Step 1. This will securely send your session to our system.
              </p>
              
              <div className="flex gap-3">
                <Button onClick={checkConnection} variant="secondary">
                  <Loader2 className="w-4 h-4 mr-2" />
                  Check Connection
                </Button>
                <Button onClick={() => router.push('/integrations')} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔒</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Security & Privacy</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your session data is encrypted using AES-256-GCM before storage</li>
                <li>• Sessions expire after 30 days of inactivity</li>
                <li>• We never store your password, only session cookies</li>
                <li>• You can disconnect at any time from the Integrations page</li>
                <li>• All data is stored securely in your private database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
