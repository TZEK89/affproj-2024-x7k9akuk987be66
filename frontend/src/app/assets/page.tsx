'use client';

import { useState } from 'react';
import { Plus, Filter, Grid, List, Image as ImageIcon, Video, Music, FileText, Download, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Asset } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AssetsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data - in production, fetch from API
  const [assets] = useState<Asset[]>([
    {
      id: 1,
      offer_id: 1,
      type: 'image',
      name: 'Yoga Pose Hero Image',
      description: 'Woman doing yoga pose at sunset',
      file_url: 'https://via.placeholder.com/400x300/4ade80/ffffff?text=Yoga+Image',
      ai_tool: 'Midjourney',
      ai_prompt: 'Professional yoga instructor doing tree pose at golden hour, serene beach background, photorealistic',
      metadata: { width: 1200, height: 800, format: 'jpg' },
      created_at: '2024-10-28T10:00:00Z',
    },
    {
      id: 2,
      offer_id: 1,
      type: 'video',
      name: 'Yoga Transformation Video',
      description: '30-second transformation video',
      file_url: 'https://via.placeholder.com/400x300/0ea5e9/ffffff?text=Video',
      ai_tool: 'Runway Gen-3',
      ai_prompt: 'Before and after yoga transformation, smooth transitions, inspiring music',
      metadata: { duration: 30, format: 'mp4', resolution: '1080p' },
      created_at: '2024-10-27T14:30:00Z',
    },
    {
      id: 3,
      offer_id: 2,
      type: 'text',
      name: 'Credit Repair Ad Copy - Urgent',
      description: 'High-converting ad copy with urgency',
      file_url: '/assets/copy/credit-repair-urgent.txt',
      ai_tool: 'Claude',
      ai_prompt: 'Write urgent ad copy for credit repair service targeting people with poor credit',
      metadata: { word_count: 85, tone: 'urgent' },
      created_at: '2024-10-26T09:15:00Z',
    },
    {
      id: 4,
      offer_id: 1,
      type: 'image',
      name: 'Yoga Mat Product Shot',
      description: 'Premium yoga mat on wooden floor',
      file_url: 'https://via.placeholder.com/400x300/22c55e/ffffff?text=Yoga+Mat',
      ai_tool: 'DALL-E 3',
      ai_prompt: 'Premium yoga mat rolled out on wooden floor, natural lighting, minimalist',
      metadata: { width: 1024, height: 1024, format: 'png' },
      created_at: '2024-10-25T16:45:00Z',
    },
    {
      id: 5,
      offer_id: 3,
      type: 'video',
      name: 'Marketing Course Promo',
      description: '15-second course promo video',
      file_url: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Promo',
      ai_tool: 'Luma AI',
      ai_prompt: 'Dynamic marketing course promo with text overlays and transitions',
      metadata: { duration: 15, format: 'mp4', resolution: '1080p' },
      created_at: '2024-10-24T11:20:00Z',
    },
    {
      id: 6,
      offer_id: 2,
      type: 'audio',
      name: 'Credit Repair Voiceover',
      description: 'Professional male voiceover',
      file_url: '/assets/audio/credit-repair-vo.mp3',
      ai_tool: 'ElevenLabs',
      ai_prompt: 'Professional, trustworthy male voice for credit repair ad',
      metadata: { duration: 25, format: 'mp3', voice: 'Adam' },
      created_at: '2024-10-23T13:00:00Z',
    },
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      case 'audio':
        return Music;
      case 'text':
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'text-success-600 bg-success-50';
      case 'video':
        return 'text-primary-600 bg-primary-50';
      case 'audio':
        return 'text-warning-600 bg-warning-50';
      case 'text':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const stats = {
    total: assets.length,
    images: assets.filter(a => a.type === 'image').length,
    videos: assets.filter(a => a.type === 'video').length,
    audio: assets.filter(a => a.type === 'audio').length,
    text: assets.filter(a => a.type === 'text').length,
  };

  return (
    <div>
      <Header
        title="Assets"
        subtitle="Manage your creative assets library"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="text">Text</option>
            </select>
            <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">All AI Tools</option>
              <option value="midjourney">Midjourney</option>
              <option value="runway">Runway Gen-3</option>
              <option value="dalle">DALL-E 3</option>
              <option value="luma">Luma AI</option>
              <option value="claude">Claude</option>
              <option value="elevenlabs">ElevenLabs</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Asset
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ImageIcon className="h-4 w-4" />
              Images
            </div>
            <div className="mt-1 text-2xl font-bold text-success-600">{stats.images}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Video className="h-4 w-4" />
              Videos
            </div>
            <div className="mt-1 text-2xl font-bold text-primary-600">{stats.videos}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Music className="h-4 w-4" />
              Audio
            </div>
            <div className="mt-1 text-2xl font-bold text-warning-600">{stats.audio}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              Text
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-600">{stats.text}</div>
          </div>
        </div>

        {/* Assets Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const Icon = getTypeIcon(asset.type);
              return (
                <div
                  key={asset.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Preview */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative group">
                    {asset.type === 'image' || asset.type === 'video' ? (
                      <img
                        src={asset.file_url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="h-16 w-16 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                        <Eye className="h-5 w-5 text-gray-700" />
                      </button>
                      <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                        <Download className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {asset.name}
                      </h3>
                      <span className={`flex-shrink-0 p-1.5 rounded-lg ${getTypeColor(asset.type)}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {asset.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <StatusBadge status={asset.ai_tool || 'manual'} />
                      <span className="text-gray-500">{formatDate(asset.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {assets.map((asset) => {
              const Icon = getTypeIcon(asset.type);
              return (
                <div
                  key={asset.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4"
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    {asset.type === 'image' || asset.type === 'video' ? (
                      <img
                        src={asset.file_url}
                        alt={asset.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Icon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{asset.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{asset.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center gap-1 text-xs ${getTypeColor(asset.type).split(' ')[0]}`}>
                        <Icon className="h-3 w-3" />
                        {asset.type}
                      </span>
                      <StatusBadge status={asset.ai_tool || 'manual'} />
                      <span className="text-xs text-gray-500">{formatDate(asset.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

