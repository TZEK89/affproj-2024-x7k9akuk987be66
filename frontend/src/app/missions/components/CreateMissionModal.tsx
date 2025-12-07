'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/Button';
import { CreateMissionRequest } from '@/types/agents';

interface CreateMissionModalProps {
  onClose: () => void;
  onCreate: (data: CreateMissionRequest) => void;
}

export default function CreateMissionModal({ onClose, onCreate }: CreateMissionModalProps) {
  const [formData, setFormData] = useState<CreateMissionRequest>({
    prompt: '',
    platform: 'hotmart',
    agents: ['manus'],
    parameters: {
      language: 'en',
      getDetails: true,
      maxProducts: 10,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create AI Research Mission</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Prompt *
            </label>
            <textarea
              required
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g., Find top 5 weight loss products with high commissions and good reviews"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Describe what you want the AI to research. Be specific about criteria like niche, commission rate, etc.
            </p>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform *
            </label>
            <select
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
            >
              <option value="hotmart">Hotmart</option>
              <option value="impact">Impact.com</option>
              <option value="clickbank">ClickBank</option>
              <option value="sharesale">ShareASale</option>
            </select>
          </div>

          {/* Agents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Agents
            </label>
            <div className="space-y-2">
              {['manus', 'claude', 'gpt4'].map(agent => (
                <label key={agent} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.agents?.includes(agent)}
                    onChange={(e) => {
                      const agents = formData.agents || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, agents: [...agents, agent] });
                      } else {
                        setFormData({ ...formData, agents: agents.filter(a => a !== agent) });
                      }
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{agent}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select multiple agents for A/B testing and consensus-based results
            </p>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={formData.parameters?.language || 'en'}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, language: e.target.value }
                })}
              >
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Products
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={formData.parameters?.maxProducts || 10}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, maxProducts: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={formData.parameters?.getDetails || false}
                onChange={(e) => setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, getDetails: e.target.checked }
                })}
              />
              <span className="ml-2 text-sm text-gray-700">Get detailed product information</span>
            </label>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              Fetch full product details (slower but more comprehensive)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Mission
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
