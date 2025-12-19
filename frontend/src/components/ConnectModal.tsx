'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Button from './Button';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  platformName: string;
  onSuccess: () => void;
}

export default function ConnectModal({ isOpen, onClose, platform, platformName, onSuccess }: ConnectModalProps) {
  const [connectSessionId, setConnectSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'waiting' | 'completing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // For Hotmart, show local connect instructions instead of starting browser automation
      if (platform === 'hotmart') {
        setStatus('waiting');
        setMessage('Follow the instructions below to connect using Local Connect');
      } else {
        startConnect();
      }
    } else {
      // Reset state when modal closes
      setStatus('idle');
      setMessage('');
      setConnectSessionId(null);
      setCurrentUrl('');
      setIsLoggedIn(false);
    }
  }, [isOpen, platform]);

  useEffect(() => {
    // Poll for status while waiting
    if (status === 'waiting' && connectSessionId) {
      const interval = setInterval(async () => {
        await checkStatus();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [status, connectSessionId]);

  const startConnect = async () => {
    try {
      setStatus('starting');
      setMessage('Launching browser window...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations/${platform}/connect/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setConnectSessionId(data.connectSessionId);
        setStatus('waiting');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Failed to start connection');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  const checkStatus = async () => {
    if (!connectSessionId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/${platform}/connect/status?connectSessionId=${connectSessionId}`
      );

      const data = await response.json();

      if (data.found) {
        setCurrentUrl(data.currentUrl);
        setIsLoggedIn(data.isLoggedIn);
      }
    } catch (error) {
      // Silently fail - we'll keep polling
    }
  };

  const completeConnect = async () => {
    if (!connectSessionId) return;

    try {
      setStatus('completing');
      setMessage('Verifying login and saving session...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations/${platform}/connect/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectSessionId })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to complete connection');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Connect to {platformName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'starting' || status === 'completing' ? (
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            ) : status === 'waiting' ? (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
            ) : status === 'success' ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : status === 'error' ? (
              <AlertCircle className="w-12 h-12 text-red-500" />
            ) : null}
          </div>

          {/* Message */}
          <p className="text-center text-gray-700">{message}</p>

          {/* Instructions for waiting state */}
          {status === 'waiting' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Instructions:</h3>
              {platform === 'hotmart' ? (
                <div className="space-y-3">
                  <div className="bg-white border border-blue-200 rounded p-3">
                    <p className="text-sm font-semibold text-blue-900 mb-2">🔧 Local Connect Method</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>Open terminal on your <strong>local machine</strong></li>
                      <li>Navigate to: <code className="bg-gray-100 px-1 py-0.5 rounded">tools/local-connector</code></li>
                      <li>Run: <code className="bg-gray-100 px-1 py-0.5 rounded">npm run connect-v2</code></li>
                      <li>Browser will open automatically</li>
                      <li>Login to Hotmart with your credentials</li>
                      <li>Complete 2FA authentication if prompted</li>
                      <li>Session will be automatically saved to backend</li>
                      <li>Return here and refresh to see connection status</li>
                    </ol>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>⚠️ Important:</strong> The Local Connect tool must run on your local machine (not in production) to capture your authenticated session securely.
                    </p>
                  </div>
                </div>
              ) : (
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>A browser window has opened</li>
                  <li>Complete the login process (including 2FA if needed)</li>
                  <li>Wait until you see the dashboard or marketplace</li>
                  <li>Click the button below to save your session</li>
                </ol>
              )}

              {currentUrl && platform !== 'hotmart' && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Current URL:</strong> {currentUrl}
                  </p>
                  {isLoggedIn && (
                    <p className="text-xs text-green-700 mt-1">
                      ✅ Login detected!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error details */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Please try again or contact support if the issue persists.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          {status === 'waiting' && (
            <>
              {platform === 'hotmart' ? (
                <Button
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={completeConnect}
                    className="flex-1"
                    disabled={!isLoggedIn}
                  >
                    I Finished Login
                  </Button>
                </>
              )}
            </>
          )}

          {(status === 'success' || status === 'error') && (
            <Button
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          )}

          {status === 'starting' || status === 'completing' ? (
            <div className="w-full text-center text-sm text-gray-500">
              Please wait...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
