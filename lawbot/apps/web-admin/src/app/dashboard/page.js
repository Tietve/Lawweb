'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        return (_jsx(DashboardLayout, { children: _jsx("div", { className: "flex items-center justify-center h-full", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "\u0110ang t\u1EA3i d\u1EEF li\u1EC7u..." })] }) }) }));
    }
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "T\u1ED5ng Quan" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Dashboard qu\u1EA3n l\u00FD h\u1EC7 th\u1ED1ng LawBot" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(StatCard, { title: "T\u1ED5ng Ng\u01B0\u1EDDi D\u00F9ng", value: stats?.totalUsers || 0, change: stats?.userGrowth, icon: _jsx(Users, { className: "w-6 h-6 text-primary-600" }) }), _jsx(StatCard, { title: "Cu\u1ED9c Tr\u00F2 Chuy\u1EC7n H\u00F4m Nay", value: stats?.todayConversations || 0, change: stats?.conversationGrowth, icon: _jsx(MessageSquare, { className: "w-6 h-6 text-primary-600" }) }), _jsx(StatCard, { title: "Tin Nh\u1EAFn/Gi\u1EDD", value: stats?.messagesPerHour || 0, icon: _jsx(Activity, { className: "w-6 h-6 text-primary-600" }) }), _jsx(StatCard, { title: "Th\u1EDDi Gian Ph\u1EA3n H\u1ED3i", value: `${stats?.avgResponseTime || 0}ms`, icon: _jsx(Clock, { className: "w-6 h-6 text-primary-600" }) })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsx(ConversationChart, { data: stats?.conversationHistory || [] }), _jsx(PlatformChart, { data: stats?.platformStats || [] })] }), _jsx(RealtimeActivity, {})] }) }));
}
