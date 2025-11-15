'use client';

import { useState } from 'react';
import { Plus, Play, Pause, Edit, Trash2, Zap, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';

interface AutomationRule {
  id: number;
  name: string;
  description: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused' | 'draft';
  executions: number;
  last_executed?: string;
  created_at: string;
}

export default function AutomationPage() {
  // Mock data - in production, fetch from API
  const [rules] = useState<AutomationRule[]>([
    {
      id: 1,
      name: 'Auto-Scale Winners',
      description: 'Automatically increase budget for high-performing campaigns',
      trigger: 'ROAS > 3.5x for 3 consecutive days',
      action: 'Increase daily budget by 25%',
      status: 'active',
      executions: 47,
      last_executed: '2024-10-29T08:30:00Z',
      created_at: '2024-10-15T10:00:00Z',
    },
    {
      id: 2,
      name: 'Pause Underperformers',
      description: 'Automatically pause campaigns below target ROAS',
      trigger: 'ROAS < 1.5x for 2 consecutive days',
      action: 'Pause campaign and send alert',
      status: 'active',
      executions: 23,
      last_executed: '2024-10-28T14:20:00Z',
      created_at: '2024-10-15T10:00:00Z',
    },
    {
      id: 3,
      name: 'Generate New Creatives',
      description: 'Create new ad creatives when performance drops',
      trigger: 'CTR drops below 2% for 5 days',
      action: 'Generate 3 new image variations',
      status: 'active',
      executions: 12,
      last_executed: '2024-10-27T09:15:00Z',
      created_at: '2024-10-18T14:00:00Z',
    },
    {
      id: 4,
      name: 'Budget Reallocation',
      description: 'Move budget from low to high performers',
      trigger: 'Weekly performance review',
      action: 'Redistribute budget based on ROAS',
      status: 'paused',
      executions: 4,
      last_executed: '2024-10-21T00:00:00Z',
      created_at: '2024-10-10T11:30:00Z',
    },
    {
      id: 5,
      name: 'New Offer Alert',
      description: 'Notify when high-quality offers are found',
      trigger: 'New offer with quality score > 85',
      action: 'Send notification and create draft campaign',
      status: 'active',
      executions: 8,
      last_executed: '2024-10-26T16:45:00Z',
      created_at: '2024-10-12T09:00:00Z',
    },
  ]);

  const ruleTemplates = [
    {
      id: 'auto-scale',
      name: 'Auto-Scale Winners',
      icon: TrendingUp,
      color: 'text-success-600 bg-success-50',
      description: 'Increase budget for high-performing campaigns',
    },
    {
      id: 'pause-losers',
      name: 'Pause Underperformers',
      icon: AlertTriangle,
      color: 'text-warning-600 bg-warning-50',
      description: 'Automatically pause low ROAS campaigns',
    },
    {
      id: 'budget-reallocation',
      name: 'Budget Reallocation',
      icon: DollarSign,
      color: 'text-primary-600 bg-primary-50',
      description: 'Redistribute budget based on performance',
    },
    {
      id: 'creative-refresh',
      name: 'Creative Refresh',
      icon: Zap,
      color: 'text-purple-600 bg-purple-50',
      description: 'Generate new creatives when CTR drops',
    },
  ];

  const activeRules = rules.filter(r => r.status === 'active').length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.executions, 0);

  return (
    <div>
      <Header
        title="Automation"
        subtitle="Manage automated workflows and rules"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Rules</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Types</option>
              <option value="campaign">Campaign Management</option>
              <option value="budget">Budget Optimization</option>
              <option value="creative">Creative Generation</option>
              <option value="alert">Alerts & Notifications</option>
            </select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Rules</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{rules.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active Rules</div>
            <div className="mt-1 text-2xl font-bold text-success-600">{activeRules}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Executions</div>
            <div className="mt-1 text-2xl font-bold text-primary-600">{totalExecutions}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Automation Rate</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">68%</div>
          </div>
        </div>

        {/* Rule Templates */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Templates</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ruleTemplates.map(template => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className={`inline-flex p-3 rounded-lg ${template.color} mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-gray-500">{template.description}</p>
                  <Button variant="ghost" size="sm" className="mt-3 w-full">
                    Use Template
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Rules */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {rules.map(rule => (
              <div key={rule.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  {/* Rule Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <StatusBadge status={rule.status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    
                    {/* Trigger & Action */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Trigger</div>
                        <div className="text-sm text-gray-900">{rule.trigger}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Action</div>
                        <div className="text-sm text-gray-900">{rule.action}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>
                        <span className="font-medium text-gray-900">{rule.executions}</span> executions
                      </span>
                      {rule.last_executed && (
                        <span>
                          Last run: {formatDate(rule.last_executed)}
                        </span>
                      )}
                      <span>
                        Created: {formatDate(rule.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {rule.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Pause:', rule)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Activate:', rule)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log('Edit:', rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log('Delete:', rule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution History */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Executions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                {
                  rule: 'Auto-Scale Winners',
                  action: 'Increased budget for "Yoga Burn - Weight Loss Women 35+" from $500 to $625',
                  time: '2 hours ago',
                  status: 'success',
                },
                {
                  rule: 'Pause Underperformers',
                  action: 'Paused "Marketing Course - Entrepreneurs" due to low ROAS (1.4x)',
                  time: '5 hours ago',
                  status: 'success',
                },
                {
                  rule: 'Generate New Creatives',
                  action: 'Generated 3 new image variations for "Credit Repair - Search Campaign"',
                  time: '1 day ago',
                  status: 'success',
                },
                {
                  rule: 'New Offer Alert',
                  action: 'Found new offer "Keto Diet Plan" with quality score 88',
                  time: '2 days ago',
                  status: 'success',
                },
              ].map((execution, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-success-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-success-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{execution.rule}</span>
                      <span className="text-xs text-gray-500">{execution.time}</span>
                    </div>
                    <p className="text-sm text-gray-600">{execution.action}</p>
                  </div>
                  <StatusBadge status={execution.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

