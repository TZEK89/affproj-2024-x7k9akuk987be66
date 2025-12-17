'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import Button from '@/components/Button';

const PLATFORM_CONFIGS: Record<string, {
  name: string;
  loginUrl: string;
  marketplaceUrl: string;
  loggedInSelector: string;
  instructions: string[];
}> = {
  hotmart: {
    name: 'Hotmart',
    loginUrl: 'https://sso.hotmart.com/login',
    marketplaceUrl: 'https://app.hotmart.com/market',
    loggedInSelector: '[data-testid="user-menu"]',
    instructions: [
      'Enter your Hotmart email and password',
      'Complete 2FA if required',
      'Wait for the marketplace to load',
      'Click "Capture Session" below'
    ]
  },
  impact: {
    name: 'Impact.com',
    loginUrl: 'https://app.impact.com/login',
    marketplaceUrl: 'https://app.impact.com/secure/advertiser/marketplace',
    loggedInSelector: '.user-profile',
    instructions: [
      'Enter your Impact.com credentials',
      'Complete any security challenges',
      'Wait for the dashboard to load',
      'Click "Capture Session" below'
    ]
  },
  clickbank: {
    name: 'ClickBank',
    loginUrl: 'https://accounts.clickbank.com/login',
    marketplaceUrl: 'https://accounts.clickbank.com/marketplace',
    loggedInSelector: '.account-menu',
    instructions: [
      'Enter your ClickBank username and password',
      'Complete security verification',
      'Wait for the marketplace to load',
      'Click "Capture Session" below'
    ]
  }
};

export default function ConnectPlatformPage() {
  const params = useParams();
  const router = useRouter();
  const platformId = params.platformId as string;
  const config = PLATFORM_CONFIGS[platformId];

  const [status, setStatus] = useState<'loading' | 'login' | 'capturing' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [browserOpened, setBrowserOpened] = useState(false);

  useEffect(() => {
    if (config) {
      openLoginBrowser();
    }
  }, [platformId]);

  const openLoginBrowser = () => {
    setStatus('login');
    setMessage(`Opening ${config.name} login page...`);

    // Open login URL in new window
    const loginWindow = window.open(
      config.loginUrl,
      '_blank',
      'width=1200,height=800,menubar=no,toolbar=no,location=no'
    );

    if (!loginWindow) {
      setStatus('error');
      setMessage('Popup blocked! Please allow popups and try again.');
      return;
    }

    setBrowserOpened(true);
    setMessage(`Please log in to ${config.name} in the popup window`);
  };

  const captureSession = async () => {
    setStatus('capturing');
    setMessage('Capturing session data...');

    try {
      // In a real implementation, this would use Playwright MCP
      // For now, we'll use a simpler approach with postMessage

      // Ask user to copy session data
      const confirmed = confirm(
        `Session Capture Instructions:\n\n` +
        `1. In the ${config.name} window, press F12 to open DevTools\n` +
        `2. Go to the Console tab\n` +
        `3. Paste this command and press Enter:\n\n` +
        `copy(JSON.stringify({cookies: document.cookie, url: location.href}))\n\n` +
        `4. Click OK below, then paste the copied data`
      );

      if (!confirmed) {
        setStatus('login');
        setMessage('Session capture cancelled');
        return;
      }

      const sessionData = prompt('Paste the session data here:');
      
      if (!sessionData) {
        setStatus('login');
        setMessage('No session data provided');
        return;
      }

      // Parse and validate session data
      const parsed = JSON.parse(sessionData);

      // Send to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform-connections/save-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId,
          sessionData: parsed
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(`Successfully connected to ${config.name}!`);
        
        // Redirect back to integrations page after 2 seconds
        setTimeout(() => {
          router.push('/integrations');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to save session');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  const verifyConnection = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform-connections/status/${platformId}`);
      const data = await response.json();

      if (data.status === 'connected') {
        setStatus('success');
        setMessage('Connection verified!');
        setTimeout(() => router.push('/integrations'), 2000);
      } else {
        setStatus('error');
        setMessage('Connection not found. Please capture session first.');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Unknown Platform</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Platform "{platformId}" is not supported.
          </p>
          <Button onClick={() => router.push('/integrations')}>
            Back to Integrations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connect to {config.name}
          </h1>
          <p className="text-gray-600">
            Follow the steps below to securely connect your {config.name} account
          </p>
        </div>

        {/* Status indicator */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-3">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            {status === 'login' && <ExternalLink className="w-5 h-5 text-blue-600" />}
            {status === 'capturing' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            {status === 'success' && <Check className="w-5 h-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            <div>
              <p className="font-medium text-gray-900">
                {status === 'loading' && 'Initializing...'}
                {status === 'login' && 'Waiting for login'}
                {status === 'capturing' && 'Capturing session'}
                {status === 'success' && 'Connected!'}
                {status === 'error' && 'Error'}
              </p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {status === 'login' && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Login Instructions:</h3>
            <ol className="space-y-2">
              {config.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {status === 'login' && browserOpened && (
            <>
              <Button onClick={captureSession} className="flex-1">
                Capture Session
              </Button>
              <Button onClick={verifyConnection} variant="secondary">
                Verify Connection
              </Button>
            </>
          )}
          
          {status === 'login' && !browserOpened && (
            <Button onClick={openLoginBrowser} className="flex-1">
              Open Login Page
            </Button>
          )}

          {status === 'error' && (
            <>
              <Button onClick={openLoginBrowser} className="flex-1">
                Try Again
              </Button>
              <Button onClick={() => router.push('/integrations')} variant="secondary">
                Cancel
              </Button>
            </>
          )}

          {status === 'success' && (
            <Button onClick={() => router.push('/integrations')} className="flex-1">
              Done
            </Button>
          )}
        </div>

        {/* Security note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🔒 Security Note:</strong> Your session data is encrypted before storage and never shared with third parties.
            Sessions expire after 30 days of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}
