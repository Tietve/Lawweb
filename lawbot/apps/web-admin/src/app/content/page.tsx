'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Document } from '@/types';
import { api } from '@/lib/api';
import { formatDateTime, formatNumber } from '@/lib/utils';

export default function ContentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await api.get<Document[]>('/api/v1/admin/documents');
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([
        {
          id: '1',
          filename: 'luat-lao-dong-2019.pdf',
          category: 'general',
          status: 'indexed',
          size: 2048000,
          uploaded_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('document', file);
      formData.append('category', selectedCategory);

      try {
        await fetch('/api/v1/admin/documents', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setUploading(false);
    loadDocuments();
    event.target.value = '';
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/admin/documents/${id}`);
      loadDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleReindex = async (id: string) => {
    try {
      await api.post(`/api/v1/admin/documents/${id}/reindex`, {});
      loadDocuments();
    } catch (error) {
      console.error('Reindex failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      uploaded: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      indexed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    const labels = {
      uploaded: 'Đã tải lên',
      processing: 'Đang xử lý',
      indexed: 'Đã lập chỉ mục',
      failed: 'Thất bại',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Văn Bản</h1>
          <p className="text-gray-600 mt-1">Tải lên và quản lý văn bản pháp luật</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tải Lên Văn Bản Mới</h2>

            <div className="flex items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="general">Tổng hợp</option>
                <option value="labor">Luật lao động</option>
                <option value="civil">Luật dân sự</option>
                <option value="criminal">Luật hình sự</option>
                <option value="administrative">Luật hành chính</option>
              </select>

              <label className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Đang tải lên...' : 'Chọn File'}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Hỗ trợ: PDF, DOCX, TXT. Tối đa 10MB mỗi file.
            </p>
          </div>

          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Văn Bản Đã Tải ({documents.length})
            </h3>

            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <FileText className="w-8 h-8 text-primary-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{doc.filename}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(doc.uploaded_at)}</p>
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReindex(doc.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lập lại chỉ mục"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {documents.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Chưa có văn bản nào. Hãy tải lên văn bản đầu tiên.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
