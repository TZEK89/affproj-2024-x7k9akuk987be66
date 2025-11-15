'use client';

import { useState } from 'react';
import { Save, User, Bell, Shield, DollarSign, Zap, Database, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'budget', name: 'Budget & Limits', icon: DollarSign },
    { id: 'automation', name: 'Automation', icon: Zap },
    { id: 'data', name: 'Data & Privacy', icon: Database },
  ];

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Manage your account and system preferences"
      />

      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          defaultValue="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          defaultValue="john@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          defaultValue="My Affiliate Business"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                          <option>UTC-5 (Eastern Time)</option>
                          <option>UTC-6 (Central Time)</option>
                          <option>UTC-7 (Mountain Time)</option>
                          <option>UTC-8 (Pacific Time)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                      {[
                        { id: 'campaign_alerts', label: 'Campaign Performance Alerts', description: 'Get notified when campaigns exceed or fall below thresholds' },
                        { id: 'budget_alerts', label: 'Budget Alerts', description: 'Notifications when budgets are running low' },
                        { id: 'new_offers', label: 'New High-Quality Offers', description: 'Alert me when new offers with quality score > 85 are found' },
                        { id: 'daily_summary', label: 'Daily Performance Summary', description: 'Daily email with key metrics and insights' },
                        { id: 'weekly_report', label: 'Weekly Performance Report', description: 'Comprehensive weekly report every Monday' },
                      ].map(item => (
                        <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Thresholds</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Low ROAS Threshold
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            defaultValue="1.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            High ROAS Threshold
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            defaultValue="3.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button>Update Password</Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <Button variant="secondary">Enable 2FA</Button>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      {[
                        { device: 'Chrome on macOS', location: 'New York, US', current: true, lastActive: 'Active now' },
                        { device: 'Safari on iPhone', location: 'New York, US', current: false, lastActive: '2 hours ago' },
                      ].map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">
                              {session.device}
                              {session.current && (
                                <span className="ml-2 text-xs text-success-600 font-normal">(Current)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.location} • {session.lastActive}
                            </div>
                          </div>
                          {!session.current && (
                            <Button variant="ghost" size="sm">
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Budget & Limits */}
              {activeTab === 'budget' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Controls</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Daily Budget Limit
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            defaultValue="5000"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Maximum total daily spend across all campaigns
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Budget Limit
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            defaultValue="150000"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Per-Campaign Daily Limit
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            defaultValue="1000"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Scaling Limits</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Budget Increase (%)
                        </label>
                        <input
                          type="number"
                          defaultValue="25"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Maximum percentage increase when auto-scaling campaigns
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          Require approval for budget increases over $500
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Budget Settings
                    </Button>
                  </div>
                </div>
              )}

              {/* Automation */}
              {activeTab === 'automation' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Preferences</h3>
                    <div className="space-y-4">
                      {[
                        { id: 'auto_scale', label: 'Auto-Scale Winners', description: 'Automatically increase budget for high-performing campaigns' },
                        { id: 'auto_pause', label: 'Auto-Pause Underperformers', description: 'Automatically pause campaigns below target ROAS' },
                        { id: 'auto_creative', label: 'Auto-Generate Creatives', description: 'Generate new creatives when performance drops' },
                        { id: 'auto_budget', label: 'Auto-Reallocate Budget', description: 'Redistribute budget based on performance' },
                        { id: 'auto_offers', label: 'Auto-Launch New Offers', description: 'Automatically create campaigns for high-quality offers' },
                      ].map(item => (
                        <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Schedule</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Optimization Frequency
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                          <option>Every hour</option>
                          <option selected>Every 4 hours</option>
                          <option>Every 12 hours</option>
                          <option>Daily</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Execution Time
                        </label>
                        <input
                          type="time"
                          defaultValue="09:00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Automation Settings
                    </Button>
                  </div>
                </div>
              )}

              {/* Data & Privacy */}
              {activeTab === 'data' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Click Data Retention
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                          <option>30 days</option>
                          <option>90 days</option>
                          <option selected>1 year</option>
                          <option>Forever</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Campaign History Retention
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                          <option>6 months</option>
                          <option selected>1 year</option>
                          <option>2 years</option>
                          <option>Forever</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Export all your data in a machine-readable format.
                    </p>
                    <Button variant="secondary">
                      <Mail className="h-4 w-4 mr-2" />
                      Request Data Export
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                    <div className="space-y-3">
                      <div className="p-4 border border-danger-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Delete All Data</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Permanently delete all campaigns, offers, and tracking data. This action cannot be undone.
                        </p>
                        <Button variant="secondary" size="sm">
                          Delete All Data
                        </Button>
                      </div>
                      <div className="p-4 border border-danger-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">Delete Account</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button variant="secondary" size="sm">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

