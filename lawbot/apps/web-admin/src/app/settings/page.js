'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
export default function SettingsPage() {
    const [config, setConfig] = useState({
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
            const data = await api.get('/api/v1/admin/config');
            setConfig(data);
        }
        catch (error) {
            console.error('Failed to load config:', error);
        }
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/api/v1/admin/config', config);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        catch (error) {
            console.error('Failed to save config:', error);
        }
        finally {
            setSaving(false);
        }
    };
    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "C\u00E0i \u0110\u1EB7t H\u1EC7 Th\u1ED1ng" }), _jsx("p", { className: "text-gray-600 mt-1", children: "C\u1EA5u h\u00ECnh c\u00E1c th\u00F4ng s\u1ED1 h\u1EC7 th\u1ED1ng" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "border-b border-gray-200 pb-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "C\u1EA5u H\u00ECnh AI" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Model Ch\u00EDnh" }), _jsxs("select", { value: config.primaryModel, onChange: (e) => updateConfig('primaryModel', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "claude-3.5", children: "Claude 3.5 Sonnet" }), _jsx("option", { value: "gpt-4", children: "GPT-4" }), _jsx("option", { value: "workers-ai", children: "Workers AI" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Temperature (0-1)" }), _jsx("input", { type: "number", min: "0", max: "1", step: "0.1", value: config.temperature, onChange: (e) => updateConfig('temperature', parseFloat(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Gi\u00E1 tr\u1ECB cao h\u01A1n = s\u00E1ng t\u1EA1o h\u01A1n, gi\u00E1 tr\u1ECB th\u1EA5p h\u01A1n = ch\u00EDnh x\u00E1c h\u01A1n" })] })] })] }), _jsxs("div", { className: "border-b border-gray-200 pb-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Gi\u1EDBi H\u1EA1n T\u1ED1c \u0110\u1ED9" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Requests/ph\u00FAt" }), _jsx("input", { type: "number", min: "1", value: config.rateLimit, onChange: (e) => updateConfig('rateLimit', parseInt(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "T\u00F9y Ch\u1ECDn H\u1EC7 Th\u1ED1ng" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: config.enableAnalytics, onChange: (e) => updateConfig('enableAnalytics', e.target.checked), className: "w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: "B\u1EADt ph\u00E2n t\u00EDch" })] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: config.enableNotifications, onChange: (e) => updateConfig('enableNotifications', e.target.checked), className: "w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: "B\u1EADt th\u00F4ng b\u00E1o" })] })] })] })] }), _jsxs("div", { className: "p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between", children: [saved && (_jsx("p", { className: "text-sm text-green-600", children: "\u0110\u00E3 l\u01B0u c\u1EA5u h\u00ECnh th\u00E0nh c\u00F4ng!" })), _jsx("div", { className: "flex-1" }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Đang lưu...' : 'Lưu Cấu Hình'] })] })] })] }) }));
}
