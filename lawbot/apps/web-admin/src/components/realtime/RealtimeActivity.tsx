'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, UserPlus, FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'message' | 'user' | 'document';
  title: string;
  description: string;
  timestamp: string;
}

export default function RealtimeActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      const mockActivities: Activity[] = [
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
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'user':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Hoạt Động Thời Gian Thực
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDateTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
