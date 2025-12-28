'use client';

import PlaceholderPage from '@/components/PlaceholderPage';
import { PiggyBank } from 'lucide-react';

export default function BudgetManagerPage() {
  return (
    <PlaceholderPage
      title="Budget Manager"
      subtitle="Set and track advertising budgets"
      icon={PiggyBank}
      hubName="Financial Command"
      features={[
        'Daily/weekly/monthly budget limits',
        'Campaign budget allocation',
        'Platform budget distribution',
        'Automated budget alerts',
        'Spend pacing controls',
        'Budget vs actual tracking',
        'Rollover budget management',
        'Team budget permissions',
      ]}
    />
  );
}
