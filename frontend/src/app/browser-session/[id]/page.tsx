'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface BrowserSession {
  id: string;
  platformId: string;
  status: string;
  currentUrl: string | null;
  lastScreenshot: string | null;
  logs: Array<{ timestamp: string; message: string }>;
}

export default function BrowserSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<BrowserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Poll for session updates every 500ms
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/browser-session/${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setSession(data.session);
          setLoading(false);
        } else {
          setError(data.error || 'Failed to load session');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSession();

    // Poll every 500ms
    const interval = setInterval(fetchSession, 500);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading browser session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'active': return '🌐';
      case 'success': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Browser Session: {session?.platformId}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Session ID: {sessionId}</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${getStatusColor(session?.status || '')}`}>
              <span className="font-semibold">
                {getStatusIcon(session?.status || '')} {session?.status?.toUpperCase()}
              </span>
            </div>
          </div>

          {session?.currentUrl && (
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Current URL:</p>
              <p className="text-sm font-mono text-gray-700 break-all">{session.currentUrl}</p>
            </div>
          )}
        </div>

        {/* Browser View */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🖥️ Live Browser View</h2>
          
          {session?.lastScreenshot ? (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={session.lastScreenshot} 
                alt="Browser screenshot" 
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
              <div className="text-gray-400 text-6xl mb-4">🌐</div>
              <p className="text-gray-600">Waiting for browser to start...</p>
              <p className="text-sm text-gray-500 mt-2">
                Manus will open the browser and screenshots will appear here
              </p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Activity Log</h2>
          
          {session?.logs && session.logs.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {session.logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-sm text-gray-700">{log.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No activity yet...</p>
          )}
        </div>

        {/* Instructions */}
        {session?.status === 'pending' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📝 Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Keep this page open to see the live browser view</li>
              <li>Message Manus: <code className="bg-blue-100 px-2 py-1 rounded">"Connect to {session.platformId}"</code></li>
              <li>Manus will open the browser and navigate to the login page</li>
              <li>You'll see the browser here - tell Manus what to do</li>
              <li>Complete login + 2FA when prompted</li>
              <li>Manus will capture and save your session automatically</li>
            </ol>
          </div>
        )}

        {session?.status === 'success' && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-green-600 text-5xl mb-3">✅</div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">Connection Successful!</h3>
            <p className="text-green-700">
              Your session has been captured and encrypted. You can now close this page.
            </p>
          </div>
        )}

        {session?.status === 'failed' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-5xl mb-3">❌</div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Connection Failed</h3>
            <p className="text-red-700">
              Something went wrong. Please try again or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
