export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: Citation[];
}

export interface Citation {
  law: string;
  article: string;
  confidence: number;
  url?: string;
  text?: string;
}

export interface WebSocketMessage {
  type: 'conversation_started' | 'message_start' | 'message_chunk' | 'message_end' | 'error';
  conversationId?: string;
  messageId?: string;
  content?: string;
  citations?: Citation[];
  error?: string;
}
