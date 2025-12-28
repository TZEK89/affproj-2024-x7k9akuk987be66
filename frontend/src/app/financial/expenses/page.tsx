'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { Receipt } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <PlaceholderPage
      title="Expense Tracker"
      subtitle="Track all advertising and operational expenses"
      icon={Receipt}
      hubName="Financial Command"
      features={[
        'Automated expense import from ad platforms',
        'Manual expense entry',
        'Category-based organization',
        'Receipt attachment and storage',
        'Recurring expense tracking',
        'Expense approval workflows',
        'Tax-ready reports',
        'Multi-currency support',
      ]}
    />
  );
}
