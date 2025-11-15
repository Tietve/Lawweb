'use client';

import { Users, MessageSquare, Clock, Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import ConversationChart from '@/components/charts/ConversationChart';
import PlatformChart from '@/components/charts/PlatformChart';
import RealtimeActivity from '@/components/realtime/RealtimeActivity';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function DashboardPage() {
  const { stats, loading } = useAnalytics();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng Quan</h1>
          <p className="text-gray-600 mt-1">Dashboard quản lý hệ thống LawBot</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng Người Dùng"
            value={stats?.totalUsers || 0}
            change={stats?.userGrowth}
            icon={<Users className="w-6 h-6 text-primary-600" />}
          />
          <StatCard
            title="Cuộc Trò Chuyện Hôm Nay"
            value={stats?.todayConversations || 0}
            change={stats?.conversationGrowth}
            icon={<MessageSquare className="w-6 h-6 text-primary-600" />}
          />
          <StatCard
            title="Tin Nhắn/Giờ"
            value={stats?.messagesPerHour || 0}
            icon={<Activity className="w-6 h-6 text-primary-600" />}
          />
          <StatCard
            title="Thời Gian Phản Hồi"
            value={`${stats?.avgResponseTime || 0}ms`}
            icon={<Clock className="w-6 h-6 text-primary-600" />}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ConversationChart data={stats?.conversationHistory || []} />
          <PlatformChart data={stats?.platformStats || []} />
        </div>

        <RealtimeActivity />
      </div>
    </DashboardLayout>
  );
}
