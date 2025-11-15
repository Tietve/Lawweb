export interface User {
  id: string;
  name: string;
  email: string;
  platform: 'zalo' | 'telegram' | 'web' | 'widget';
  created_at: string;
  last_active: string;
  status: 'active' | 'inactive' | 'blocked';
}

export interface Conversation {
  id: string;
  user_id: string;
  user_name: string;
  platform: string;
  status: 'active' | 'closed';
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface AnalyticsStats {
  totalUsers: number;
  todayConversations: number;
  messagesPerHour: number;
  avgResponseTime: number;
  userGrowth?: number;
  conversationGrowth?: number;
  conversationHistory?: { time: string; value: number }[];
  platformStats?: { platform: string; count: number }[];
}

export interface Document {
  id: string;
  filename: string;
  category: string;
  status: 'uploaded' | 'processing' | 'indexed' | 'failed';
  size: number;
  uploaded_at: string;
  progress?: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface SystemConfig {
  primaryModel: string;
  temperature: number;
  rateLimit: number;
  enableAnalytics: boolean;
  enableNotifications: boolean;
}
