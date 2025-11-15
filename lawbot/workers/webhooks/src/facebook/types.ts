/**
 * Facebook Messenger types and interfaces
 */

export interface MessengerWebhookEntry {
  id: string;
  time: number;
  messaging?: MessagingEvent[];
  standby?: MessagingEvent[];
}

export interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: MessageEvent;
  postback?: PostbackEvent;
  quick_reply?: QuickReplyEvent;
}

export interface MessageEvent {
  mid: string;
  text?: string;
  quick_reply?: { payload: string };
  attachments?: Attachment[];
}

export interface PostbackEvent {
  payload: string;
  title?: string;
}

export interface QuickReplyEvent {
  payload: string;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'location' | 'template';
  payload: {
    url?: string;
    coordinates?: {
      lat: number;
      long: number;
    };
  };
}

export interface QuickReply {
  content_type: 'text';
  title: string;
  payload: string;
  image_url?: string;
}

export interface MessagePayload {
  text?: string;
  attachment?: {
    type: 'image' | 'video' | 'audio' | 'file' | 'template';
    payload: {
      url?: string;
      is_reusable?: boolean;
      template_type?: string;
      elements?: unknown[];
    };
  };
  quick_replies?: QuickReply[];
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_pic: string;
}

export interface Citation {
  law: string;
  article: string;
  confidence: number;
  content?: string;
}

export interface Env {
  DB: D1Database;
  WEBHOOK_CACHE: KVNamespace;
  CHATBOT: Fetcher;
  MESSENGER_VERIFY_TOKEN: string;
  MESSENGER_PAGE_ACCESS_TOKEN: string;
  MESSENGER_APP_SECRET: string;
  FB_QUEUE?: Queue;
  ZALO_APP_ID: string;
  ZALO_APP_SECRET: string;
  ZALO_OA_ID: string;
  ZALO_SYNTAX_FILTER?: string;
  ENVIRONMENT: string;
}
