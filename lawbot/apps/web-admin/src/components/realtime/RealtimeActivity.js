'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { MessageSquare, UserPlus, FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
export default function RealtimeActivity() {
    const [activities, setActivities] = useState([]);
    useEffect(() => {
        loadActivities();
        const interval = setInterval(loadActivities, 10000);
        return () => clearInterval(interval);
    }, []);
    const loadActivities = async () => {
        try {
            const mockActivities = [
                {
                    id: '1',
                    type: 'message',
                    title: 'Tin nhắn mới',
                    description: 'Người dùng Nguyễn Văn A đã gửi tin nhắn',
                    timestamp: new Date().toISOString(),
                },
                {
                    id: '2',
                    type: 'user',
                    title: 'Người dùng mới',
                    description: 'Trần Thị B đã đăng ký',
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                },
            ];
            setActivities(mockActivities);
        }
        catch (error) {
            console.error('Failed to load activities:', error);
        }
    };
    const getIcon = (type) => {
        switch (type) {
            case 'message':
                return _jsx(MessageSquare, { className: "w-5 h-5 text-blue-600" });
            case 'user':
                return _jsx(UserPlus, { className: "w-5 h-5 text-green-600" });
            case 'document':
                return _jsx(FileText, { className: "w-5 h-5 text-purple-600" });
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Ho\u1EA1t \u0110\u1ED9ng Th\u1EDDi Gian Th\u1EF1c" }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "space-y-4", children: activities.map(activity => (_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "p-2 bg-gray-50 rounded-lg", children: getIcon(activity.type) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: activity.title }), _jsx("p", { className: "text-sm text-gray-600", children: activity.description }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: formatDateTime(activity.timestamp) })] })] }, activity.id))) }) })] }));
}
