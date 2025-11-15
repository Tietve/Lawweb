'use client';

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Conversation, Message } from '@/types';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
      const data = await api.get<Conversation[]>('/api/v1/admin/conversations');
      setConversations(data);
    } catch (error) {
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

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await api.get<Message[]>(`/api/v1/admin/conversations/${conversationId}/messages`);
      setMessages(data);
    } catch (error) {
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
    if (!selected || !interventionText.trim()) return;

    try {
      await api.post(`/api/v1/admin/conversations/${selected.id}/intervene`, {
        message: interventionText,
      });
      setInterventionText('');
      loadMessages(selected.id);
    } catch (error) {
      console.error('Failed to send intervention:', error);
    }
  };

  const activeCount = conversations.filter(c => c.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giám Sát Cuộc Trò Chuyện</h1>
          <p className="text-gray-600 mt-1">Theo dõi và can thiệp cuộc trò chuyện</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                Đang Hoạt Động ({activeCount})
              </h2>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selected?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{conv.user_name}</p>
                      <p className="text-sm text-gray-500">{conv.platform.toUpperCase()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      conv.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {conv.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                    </span>
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {conv.last_message}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDateTime(conv.updated_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-lg shadow flex flex-col">
            {selected ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">
                    {selected.user_name} - {selected.platform.toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selected.message_count} tin nhắn
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-gray-100 text-gray-900'
                            : msg.role === 'system'
                            ? 'bg-yellow-50 text-yellow-900'
                            : 'bg-primary-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.role === 'assistant' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {formatDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={interventionText}
                      onChange={(e) => setInterventionText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleIntervene()}
                      placeholder="Nhập tin nhắn can thiệp..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleIntervene}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Gửi
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Chọn cuộc trò chuyện để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
