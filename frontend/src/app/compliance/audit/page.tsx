'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { Shield } from 'lucide-react';

export default function AuditLogPage() {
  return (
    <PlaceholderPage
      title="Audit Log"
      subtitle="View compliance audit history"
      icon={Shield}
      hubName="Compliance"
      features={[
        'Complete activity history',
        'User action tracking',
        'Campaign change log',
        'Compliance check history',
        'Export audit reports',
        'Search and filter',
        'Retention policy management',
        'Regulatory compliance reports',
      ]}
    />
  );
}
