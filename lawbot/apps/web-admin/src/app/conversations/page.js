'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
export default function ConversationsPage() {
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [interventionText, setInterventionText] = useState('');
    useEffect(() => {
        loadConversations();
        const interval = setInterval(loadConversations, 10000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (selected) {
            loadMessages(selected.id);
        }
    }, [selected]);
    const loadConversations = async () => {
        try {
            const data = await api.get('/api/v1/admin/conversations');
            setConversations(data);
        }
        catch (error) {
            console.error('Failed to load conversations:', error);
            setConversations([
                {
                    id: '1',
                    user_id: '1',
                    user_name: 'Nguyễn Văn A',
                    platform: 'web',
                    status: 'active',
                    message_count: 5,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_message: 'Xin chào, tôi cần tư vấn về luật lao động',
                },
            ]);
        }
    };
    const loadMessages = async (conversationId) => {
        try {
            const data = await api.get(`/api/v1/admin/conversations/${conversationId}/messages`);
            setMessages(data);
        }
        catch (error) {
            console.error('Failed to load messages:', error);
            setMessages([
                {
                    id: '1',
                    conversation_id: conversationId,
                    role: 'user',
                    content: 'Xin chào, tôi cần tư vấn về luật lao động',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '2',
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: 'Xin chào! Tôi có thể giúp gì cho bạn về luật lao động?',
                    created_at: new Date().toISOString(),
                },
            ]);
        }
    };
    const handleIntervene = async () => {
        if (!selected || !interventionText.trim())
            return;
        try {
            await api.post(`/api/v1/admin/conversations/${selected.id}/intervene`, {
                message: interventionText,
            });
            setInterventionText('');
            loadMessages(selected.id);
        }
        catch (error) {
            console.error('Failed to send intervention:', error);
        }
    };
    const activeCount = conversations.filter(c => c.status === 'active').length;
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Gi\u00E1m S\u00E1t Cu\u1ED9c Tr\u00F2 Chuy\u1EC7n" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Theo d\u00F5i v\u00E0 can thi\u1EC7p cu\u1ED9c tr\u00F2 chuy\u1EC7n" })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]", children: [_jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("h2", { className: "font-semibold text-gray-900", children: ["\u0110ang Ho\u1EA1t \u0110\u1ED9ng (", activeCount, ")"] }) }), _jsx("div", { className: "overflow-y-auto h-full", children: conversations.map(conv => (_jsxs("div", { onClick: () => setSelected(conv), className: `p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selected?.id === conv.id ? 'bg-primary-50' : ''}`, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: conv.user_name }), _jsx("p", { className: "text-sm text-gray-500", children: conv.platform.toUpperCase() })] }), _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${conv.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`, children: conv.status === 'active' ? 'Đang hoạt động' : 'Đã đóng' })] }), conv.last_message && (_jsx("p", { className: "text-sm text-gray-600 mt-2 line-clamp-2", children: conv.last_message })), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: formatDateTime(conv.updated_at) })] }, conv.id))) })] }), _jsx("div", { className: "md:col-span-2 bg-white rounded-lg shadow flex flex-col", children: selected ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsxs("h2", { className: "font-semibold text-gray-900", children: [selected.user_name, " - ", selected.platform.toUpperCase()] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [selected.message_count, " tin nh\u1EAFn"] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: messages.map(msg => (_jsx("div", { className: `flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`, children: _jsxs("div", { className: `max-w-[70%] rounded-lg p-3 ${msg.role === 'user'
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : msg.role === 'system'
                                                        ? 'bg-yellow-50 text-yellow-900'
                                                        : 'bg-primary-600 text-white'}`, children: [_jsx("p", { className: "text-sm", children: msg.content }), _jsx("p", { className: `text-xs mt-1 ${msg.role === 'assistant' ? 'text-primary-100' : 'text-gray-500'}`, children: formatDateTime(msg.created_at) })] }) }, msg.id))) }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: interventionText, onChange: (e) => setInterventionText(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleIntervene(), placeholder: "Nh\u1EADp tin nh\u1EAFn can thi\u1EC7p...", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" }), _jsxs("button", { onClick: handleIntervene, className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center", children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), "G\u1EEDi"] })] }) })] })) : (_jsx("div", { className: "flex-1 flex items-center justify-center text-gray-500", children: "Ch\u1ECDn cu\u1ED9c tr\u00F2 chuy\u1EC7n \u0111\u1EC3 xem chi ti\u1EBFt" })) })] })] }) }));
}
