'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page for old /platform-connections URL
 * This page has been replaced by /integrations
 */
export default function PlatformConnectionsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to new integrations page
    router.replace('/integrations');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Platform Connections...</p>
      </div>
    </div>
  );
}
