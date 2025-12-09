'use client';

import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import { Mail, Construction } from 'lucide-react';

export default function EmailMarketingPage() {
  return (
    <div>
      <div className="p-6 pb-0">
        <Breadcrumb items={[
          { name: 'Campaign Center' },
          { name: 'Email Marketing' }
        ]} />
      </div>
      <Header
        title="Email Marketing"
        subtitle="Manage email campaigns and automation"
      />
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Construction className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600">Email marketing features are currently under development.</p>
        </div>
      </div>
    </div>
  );
}
