'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { User } from '@/types';
import { api } from '@/lib/api';
import { formatDateTime, exportToCSV } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get<User[]>('/api/v1/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([
        {
          id: '1',
          name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          platform: 'web',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          status: 'active',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || user.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const handleExport = () => {
    exportToCSV(filteredUsers, 'users');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status === 'active' ? 'Hoạt động' : status === 'inactive' ? 'Không hoạt động' : 'Chặn'}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi người dùng hệ thống</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tất cả nền tảng</option>
                  <option value="web">Web</option>
                  <option value="zalo">Zalo</option>
                  <option value="telegram">Telegram</option>
                  <option value="widget">Widget</option>
                </select>

                <button
                  onClick={handleExport}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </button>
              </div>
            </div>
          </div>

          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Tên' },
              { key: 'email', label: 'Email' },
              {
                key: 'platform',
                label: 'Nền Tảng',
                render: (value) => value.toUpperCase(),
              },
              {
                key: 'created_at',
                label: 'Ngày Tạo',
                render: (value) => formatDateTime(value),
              },
              {
                key: 'last_active',
                label: 'Hoạt Động Gần Nhất',
                render: (value) => formatDateTime(value),
              },
              {
                key: 'status',
                label: 'Trạng Thái',
                render: (value) => getStatusBadge(value),
              },
            ]}
            data={filteredUsers}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
