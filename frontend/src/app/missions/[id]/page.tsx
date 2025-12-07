'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Zap, CheckCircle, XCircle, Clock, Eye, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { agentsApi } from '@/lib/api-service';
import { Mission, AgentLog, DiscoveredProduct } from '@/types/agents';
import Link from 'next/link';

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.id as string;

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMission();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchMission, 3000);
    return () => clearInterval(interval);
  }, [missionId]);

  const fetchMission = async () => {
    try {
      const response = await agentsApi.getMissionById(missionId);
      if (response.success) {
        setMission(response.mission);
      }
    } catch (err: any) {
      console.error('Error fetching mission:', err);
      setError(err.message || 'Failed to load mission');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteProduct = async (productId: number) => {
    try {
      await agentsApi.promoteProduct(productId.toString());
      alert('Product promoted successfully!');
      fetchMission();
    } catch (err: any) {
      console.error('Error promoting product:', err);
      alert('Failed to promote product: ' + err.message);
    }
  };

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case 'action':
        return <Zap className="h-4 w-4 text-primary-600" />;
      case 'observation':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'decision':
        return <Brain className="h-4 w-4 text-purple-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-error-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Mission Details" />
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          Loading mission...
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div>
        <Header title="Mission Details" />
        <div className="p-6">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-800">
            {error || 'Mission not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Mission Details"
        subtitle={mission.prompt}
      />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/missions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Missions
            </Button>
          </Link>
        </div>

        {/* Mission Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{mission.prompt}</h2>
                <StatusBadge status={mission.status} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 text-sm">
                <div>
                  <span className="text-gray-500">Platform:</span>{' '}
                  <span className="font-medium text-gray-900 capitalize">{mission.platform}</span>
                </div>
                <div>
                  <span className="text-gray-500">Agents:</span>{' '}
                  <span className="font-medium text-gray-900">{mission.agents.join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>{' '}
                  <span className="font-medium text-gray-900">{formatDate(mission.created_at)}</span>
                </div>
                {mission.completed_at && (
                  <div>
                    <span className="text-gray-500">Completed:</span>{' '}
                    <span className="font-medium text-gray-900">{formatDate(mission.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {mission.error_message && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <p className="text-sm text-error-800 font-medium">Error:</p>
              <p className="text-sm text-error-700 mt-1">{mission.error_message}</p>
            </div>
          )}

          {mission.jobStatus && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Job Progress</span>
                <span className="text-sm text-gray-600">{mission.jobStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${mission.jobStatus.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Logs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Agent Activity Log</h3>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {mission.logs && mission.logs.length > 0 ? (
                <div className="space-y-4">
                  {mission.logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        {getLogIcon(log.log_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">{log.log_type}</span>
                          <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-900">{log.message}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="mt-2 text-xs bg-gray-50 rounded p-2 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No activity logs yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Discovered Products */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Discovered Products ({mission.discoveredProducts?.length || 0})
              </h3>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {mission.discoveredProducts && mission.discoveredProducts.length > 0 ? (
                <div className="space-y-4">
                  {mission.discoveredProducts.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                      <div className="flex items-start gap-4">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{product.product_name}</h4>
                          <div className="flex items-center gap-4 text-sm mb-2">
                            <span className="text-gray-600">
                              {formatCurrency(product.price, product.currency)}
                            </span>
                            <span className="text-success-600 font-medium">
                              {product.commission_rate}% commission
                            </span>
                          </div>
                          
                          {/* AI Score */}
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-500">AI Score:</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    product.ai_score >= 80 ? 'bg-success-600' :
                                    product.ai_score >= 60 ? 'bg-warning-600' :
                                    'bg-error-600'
                                  }`}
                                  style={{ width: `${product.ai_score}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-gray-900">{product.ai_score}/100</span>
                            </div>
                          </div>

                          {/* AI Recommendation */}
                          {product.ai_recommendation && (
                            <p className="text-xs text-gray-600 mb-2">{product.ai_recommendation}</p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handlePromoteProduct(product.id)}
                              disabled={product.status === 'promoted'}
                            >
                              {product.status === 'promoted' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Promoted
                                </>
                              ) : (
                                <>
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  Promote
                                </>
                              )}
                            </Button>
                            {product.product_url && (
                              <a
                                href={product.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <p className="text-sm">No products discovered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
