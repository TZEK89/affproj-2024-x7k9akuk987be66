'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Sparkles, History, FileText, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import Button from './Button';

interface ImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentImageUrl?: string;
  onImageUpdated: (newImageUrl: string) => void;
}

interface ImageHistoryItem {
  id: string;
  image_url: string;
  source: 'upload' | 'ai_generated' | 'default';
  prompt?: string;
  created_at: string;
}

export default function ImageManagerModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentImageUrl,
  onImageUpdated,
}: ImageManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'generate' | 'history' | 'notes'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [notes, setNotes] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadImageHistory();
      loadNotes();
      setCustomPrompt(`Professional product cover for "${productName}"`);
    }
  }, [isOpen, productId]);

  const loadImageHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/images/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setImageHistory(data.data);
      }
    } catch (err) {
      console.error('Error loading image history:', err);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setNotes(data.data[0].content);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Image uploaded successfully!');
        onImageUpdated(data.data.image_url);
        loadImageHistory();
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!customPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ prompt: customPrompt }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Image generated successfully!');
        onImageUpdated(data.data.image_url);
        loadImageHistory();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestoreImage = async (imageUrl: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Image restored successfully!');
        onImageUpdated(imageUrl);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Restore failed');
      }
    } catch (err: any) {
      setError(err.message || 'Restore failed');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: notes }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Notes saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch (err: any) {
      setError(err.message || 'Save failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Product Image</h3>
                <p className="text-sm text-gray-600 mt-1">{productName}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-50 px-6 border-b border-gray-200">
            <div className="flex space-x-4">
              {[
                { id: 'upload', label: 'Upload', icon: Upload },
                { id: 'generate', label: 'AI Generate', icon: Sparkles },
                { id: 'history', label: 'History', icon: History },
                { id: 'notes', label: 'Notes', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            {/* Success/Error Messages */}
            {(success || error) && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {success || error}
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">JPG, PNG, or WebP (max 5MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {selectedFile && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Generate Tab */}
            {activeTab === 'generate' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Prompt
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the image you want to generate..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Be specific about style, colors, and composition for best results.
                  </p>
                </div>

                {currentImageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Image
                    </label>
                    <img
                      src={currentImageUrl}
                      alt="Current"
                      className="max-h-48 rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                <Button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !customPrompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating with DALL-E 3...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate New Image
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {imageHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No image history yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {imageHistory.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <img
                          src={item.image_url}
                          alt="History"
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              {item.source === 'ai_generated' ? '🎨 AI Generated' : '📤 Uploaded'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {item.prompt && (
                            <p className="text-xs text-gray-600 line-clamp-2">{item.prompt}</p>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRestoreImage(item.image_url)}
                            className="w-full"
                          >
                            Restore This Image
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Add notes about this product, marketing ideas, target audience, etc."
                  />
                </div>

                <Button onClick={handleSaveNotes} className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Save Notes
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
