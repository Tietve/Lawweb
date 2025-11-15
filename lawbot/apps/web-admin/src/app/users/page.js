'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Download, Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { formatDateTime, exportToCSV } from '@/lib/utils';
export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    useEffect(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        try {
            const data = await api.get('/api/v1/admin/users');
            setUsers(data);
        }
        catch (error) {
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
        }
        finally {
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
    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            blocked: 'bg-red-100 text-red-800',
        };
        return (_jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`, children: status === 'active' ? 'Hoạt động' : status === 'inactive' ? 'Không hoạt động' : 'Chặn' }));
    };
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Qu\u1EA3n L\u00FD Ng\u01B0\u1EDDi D\u00F9ng" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Qu\u1EA3n l\u00FD v\u00E0 theo d\u00F5i ng\u01B0\u1EDDi d\u00F9ng h\u1EC7 th\u1ED1ng" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsx("div", { className: "flex-1 max-w-lg", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "T\u00ECm ki\u1EBFm theo t\u00EAn ho\u1EB7c email...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" })] }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: platformFilter, onChange: (e) => setPlatformFilter(e.target.value), className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "all", children: "T\u1EA5t c\u1EA3 n\u1EC1n t\u1EA3ng" }), _jsx("option", { value: "web", children: "Web" }), _jsx("option", { value: "zalo", children: "Zalo" }), _jsx("option", { value: "telegram", children: "Telegram" }), _jsx("option", { value: "widget", children: "Widget" })] }), _jsxs("button", { onClick: handleExport, className: "flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Xu\u1EA5t CSV"] })] })] }) }), _jsx(DataTable, { columns: [
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
                            ], data: filteredUsers })] })] }) }));
}
