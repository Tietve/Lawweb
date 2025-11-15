'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SystemConfig } from '@/types';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    primaryModel: 'claude-3.5',
    temperature: 0.7,
    rateLimit: 60,
    enableAnalytics: true,
    enableNotifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.get<SystemConfig>('/api/v1/admin/config');
      setConfig(data);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/v1/admin/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài Đặt Hệ Thống</h1>
          <p className="text-gray-600 mt-1">Cấu hình các thông số hệ thống</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cấu Hình AI</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Chính
                  </label>
                  <select
                    value={config.primaryModel}
                    onChange={(e) => updateConfig('primaryModel', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="claude-3.5">Claude 3.5 Sonnet</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="workers-ai">Workers AI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (0-1)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Giá trị cao hơn = sáng tạo hơn, giá trị thấp hơn = chính xác hơn
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Giới Hạn Tốc Độ</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requests/phút
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.rateLimit}
                  onChange={(e) => updateConfig('rateLimit', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tùy Chọn Hệ Thống</h2>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableAnalytics}
                    onChange={(e) => updateConfig('enableAnalytics', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Bật phân tích</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableNotifications}
                    onChange={(e) => updateConfig('enableNotifications', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Bật thông báo</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            {saved && (
              <p className="text-sm text-green-600">Đã lưu cấu hình thành công!</p>
            )}
            <div className="flex-1"></div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
