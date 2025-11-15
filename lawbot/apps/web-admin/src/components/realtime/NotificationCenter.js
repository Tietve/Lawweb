'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);
    const loadNotifications = async () => {
        try {
            const data = await api.get('/api/v1/admin/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        }
        catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };
    const markAsRead = async (id) => {
        try {
            await api.put(`/api/v1/admin/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowDropdown(!showDropdown), className: "relative p-2 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsx(Bell, { className: "w-6 h-6 text-gray-600" }), unreadCount > 0 && (_jsx("span", { className: "absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center", children: unreadCount > 9 ? '9+' : unreadCount }))] }), showDropdown && (_jsxs("div", { className: "absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsx("h3", { className: "font-semibold text-gray-900", children: "Th\u00F4ng B\u00E1o" }) }), _jsx("div", { className: "max-h-96 overflow-y-auto", children: notifications.length === 0 ? (_jsx("div", { className: "p-4 text-center text-gray-500", children: "Kh\u00F4ng c\u00F3 th\u00F4ng b\u00E1o m\u1EDBi" })) : (notifications.map(notif => (_jsxs("div", { onClick: () => markAsRead(notif.id), className: `p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${!notif.read ? 'bg-blue-50' : ''}`, children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: notif.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: notif.message }), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: formatDateTime(notif.created_at) })] }, notif.id)))) })] }))] }));
}
