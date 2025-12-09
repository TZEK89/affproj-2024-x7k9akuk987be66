'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Eye, Trash2, Brain, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { agentsApi } from '@/lib/api-service';
import { Mission, AgentStatus } from '@/types/agents';
import CreateMissionModal from './components/CreateMissionModal';
import Link from 'next/link';

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchMissions();
    fetchAgentStatus();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchMissions();
      fetchAgentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await agentsApi.getAllMissions();
      if (response.success) {
        setMissions(response.missions || []);
      }
    } catch (err: any) {
      console.error('Error fetching missions:', err);
      setError(err.message || 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const response = await agentsApi.getAgentStatus();
      if (response.success) {
        setAgentStatus(response.status);
      }
    } catch (err: any) {
      console.error('Error fetching agent status:', err);
    }
  };

  const handleCreateMission = async (missionData: any) => {
    try {
      const response = await agentsApi.createMission(missionData);
      if (response.success) {
        setIsCreateModalOpen(false);
        fetchMissions();
      }
    } catch (err: any) {
      console.error('Error creating mission:', err);
      alert('Failed to create mission: ' + err.message);
    }
  };

  const handleDeleteMission = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;
    
    try {
      await agentsApi.deleteMission(id.toString());
      fetchMissions();
    } catch (err: any) {
      console.error('Error deleting mission:', err);
      alert('Failed to delete mission: ' + err.message);
    }
  };

  const filteredMissions = missions.filter(mission => {
    if (filter === 'all') return true;
    return mission.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-error-600" />;
      case 'running':
        return <Zap className="h-5 w-5 text-primary-600 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (error) {
    return (
      <div>
        <Header title="AI Research Missions" subtitle="Intelligent marketplace research powered by AI agents" />
        <div className="p-6">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-800">
            Error loading missions: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-6 pb-0">
        <Breadcrumb items={[
          { name: 'Intelligence' },
          { name: 'AI Agents' }
        ]} />
      </div>
      <Header
        title="AI Agents"
        subtitle="Launch and monitor intelligent automation tasks"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Missions</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {agentStatus?.totalMissions || 0}
                </div>
              </div>
              <Brain className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active Now</div>
                <div className="mt-1 text-2xl font-bold text-primary-600">
                  {agentStatus?.activeMissions || 0}
                </div>
              </div>
              <Zap className="h-8 w-8 text-primary-400 animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="mt-1 text-2xl font-bold text-success-600">
                  {agentStatus?.completedMissions || 0}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-success-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Products Found</div>
                <div className="mt-1 text-2xl font-bold text-purple-600">
                  {agentStatus?.totalDiscoveredProducts || 0}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select 
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Missions</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Mission
          </Button>
        </div>

        {/* Missions List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Research Missions</h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              Loading missions...
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No missions yet</p>
              <p className="text-sm mb-4">Create your first AI research mission to get started</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Mission
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMissions.map(mission => (
                <div key={mission.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(mission.status)}
                        <h4 className="font-medium text-gray-900">{mission.prompt}</h4>
                        <StatusBadge status={mission.status} />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-3">
                        <div className="text-sm">
                          <span className="text-gray-500">Platform:</span>{' '}
                          <span className="font-medium text-gray-900 capitalize">{mission.platform}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Agents:</span>{' '}
                          <span className="font-medium text-gray-900">{mission.agents.join(', ')}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Created:</span>{' '}
                          <span className="font-medium text-gray-900">{formatDate(mission.created_at)}</span>
                        </div>
                      </div>

                      {mission.error_message && (
                        <div className="bg-error-50 border border-error-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-error-800">{mission.error_message}</p>
                        </div>
                      )}

                      {mission.discoveredProducts && mission.discoveredProducts.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-success-600">{mission.discoveredProducts.length}</span> products discovered
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/missions/${mission.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {mission.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => agentsApi.executeAgenticMission(mission.id.toString())}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMission(mission.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Mission Modal */}
      {isCreateModalOpen && (
        <CreateMissionModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateMission}
        />
      )}
    </div>
  );
}
