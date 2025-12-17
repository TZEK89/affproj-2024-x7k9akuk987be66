'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Key, Brain } from 'lucide-react';

interface LLMConfig {
  id: number;
  provider: string;
  model: string;
  displayName: string;
  isActive: boolean;
  hasApiKey: boolean;
  createdAt: string;
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
  { id: 'google', name: 'Google', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'ollama', name: 'Ollama (Local)', models: ['llama3.1', 'mistral', 'codellama', 'qwen2.5'] },
  { id: 'custom', name: 'Custom API', models: ['custom-model'] }
];

export default function LLMConfigPage() {
  const [configurations, setConfigurations] = useState<LLMConfig[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [displayName, setDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm-config`);
      const data = await response.json();
      
      if (data.success) {
        setConfigurations(data.configurations);
      }
    } catch (error) {
      console.error('Error loading LLM configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfiguration = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          displayName: displayName || `${selectedProvider} ${selectedModel}`,
          apiKey,
          baseUrl: baseUrl || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadConfigurations();
        setShowAddForm(false);
        resetForm();
        alert('✅ LLM configuration added successfully!');
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteConfiguration = async (id: number) => {
    if (!confirm('Are you sure you want to delete this LLM configuration?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm-config/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadConfigurations();
        alert('✅ Configuration deleted');
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/llm-config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      const data = await response.json();

      if (data.success) {
        await loadConfigurations();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setSelectedProvider('openai');
    setSelectedModel('gpt-4o-mini');
    setDisplayName('');
    setApiKey('');
    setBaseUrl('');
  };

  const getProviderModels = () => {
    return PROVIDERS.find(p => p.id === selectedProvider)?.models || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LLM configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                LLM Configuration
              </h1>
              <p className="text-gray-600 mt-2">
                Configure AI models for your agents. Add custom API keys for OpenAI, Anthropic, local models, and more.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add LLM
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New LLM Configuration</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    const models = PROVIDERS.find(p => p.id === e.target.value)?.models || [];
                    setSelectedModel(models[0] || '');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {PROVIDERS.map(provider => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {getProviderModels().map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name (Optional)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={`${selectedProvider} ${selectedModel}`}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              {/* Base URL (for custom/local) */}
              {(selectedProvider === 'ollama' || selectedProvider === 'custom') && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434 or custom API endpoint"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddConfiguration}
                disabled={!apiKey}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Add Configuration
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Configurations List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configured LLMs</h2>

          {configurations.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No LLM configurations yet</p>
              <p className="text-gray-400 text-sm mt-2">Add your first LLM to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {configurations.map(config => (
                <div
                  key={config.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{config.displayName}</h3>
                      <p className="text-sm text-gray-500">
                        {config.provider} • {config.model}
                        {config.hasApiKey && <span className="ml-2 text-green-600">🔑 API Key Set</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(config.id, config.isActive)}
                      className={`px-3 py-1 rounded text-sm ${
                        config.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {config.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteConfiguration(config.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How LLM Configuration Works</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• <strong>AI Agents</strong> will use your configured LLMs for scraping, analysis, and content generation</li>
            <li>• <strong>API Keys</strong> are encrypted with AES-256-GCM and stored securely</li>
            <li>• <strong>Local Models</strong> (Ollama) can be used for privacy and cost savings</li>
            <li>• <strong>Custom APIs</strong> support any OpenAI-compatible endpoint</li>
            <li>• <strong>Active LLMs</strong> are available for agent selection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
