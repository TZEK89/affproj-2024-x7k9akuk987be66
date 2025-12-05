'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  return (
    <AuthProvider>
      {isPublicRoute ? (
        // Public pages (login, register) - no sidebar, no auth guard
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      ) : (
        // Protected pages - with sidebar and auth guard
        <ProtectedRoute>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50">
              {children}
            </main>
          </div>
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}
