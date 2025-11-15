/**
 * @lawbot/shared
 * Shared utilities and types
 */

export const version = '0.1.0';

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Platform types
 */
export type Platform = 'zalo' | 'messenger' | 'web' | 'widget';

/**
 * Zalo webhook event types
 */
export type ZaloEventType =
  | 'user_send_text'
  | 'user_send_image'
  | 'user_send_audio'
  | 'user_send_video'
  | 'user_send_file'
  | 'user_send_sticker'
  | 'user_send_link'
  | 'user_send_location'
  | 'follow'
  | 'unfollow';

/**
 * Zalo webhook event data
 */
export interface ZaloWebhookEvent {
  app_id: string;
  user_id_by_app: string;
  event_name: ZaloEventType;
  timestamp: string;
  sender?: {
    id: string;
  };
  recipient?: {
    id: string;
  };
  message?: {
    text?: string;
    msg_id?: string;
    attachments?: Array<{
      type: string;
      payload: {
        url?: string;
        thumbnail?: string;
        coordinates?: { latitude: number; longitude: number };
      };
    }>;
  };
}

/**
 * Zalo quick reply option
 */
export interface ZaloQuickReplyOption {
  title: string;
  payload: string;
  icon?: string;
}

/**
 * Message queue item
 */
export interface QueueMessage {
  type: 'message' | 'follow' | 'unfollow';
  userId: string;
  text?: string;
  timestamp: string;
  platform: Platform;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}

/**
 * User info
 */
export interface User {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  platform: Platform;
  created_at: number;
  last_active: number;
  metadata: string;
}

/**
 * Citation info
 */
export interface Citation {
  law: string;
  article: string;
  relevance?: number;
}
