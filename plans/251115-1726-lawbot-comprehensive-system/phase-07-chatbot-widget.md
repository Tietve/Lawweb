# Phase 07: AI Chatbot Widget

## Context Links
- [Parent Plan](plan.md)
- [Prev: Web Public](phase-06-web1-public.md)
- [Next: Web Admin](phase-08-web2-admin.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Embeddable AI chatbot widget with streaming responses
- **Priority**: P1 - Core user interaction
- **Implementation Status**: 🟢 Completed
- **Review Status**: 🟡 Pending Review

## Key Insights
- Lightweight iframe embed
- WebSocket for real-time
- Markdown rendering support
- Citation display crucial
- Multi-platform compatible

## Requirements

### Functional
- Real-time chat interface
- Streaming AI responses
- Message history
- Citation display
- File upload support
- Quick reply suggestions

### Non-functional
- <50KB bundle size
- Works in iframe
- Mobile optimized
- Offline message queue
- Session persistence

## Architecture

```
apps/chat-widget/
├── src/
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageList.tsx
│   │   ├── InputBar.tsx
│   │   └── Citations.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useChat.ts
│   └── lib/
│       ├── api.ts
│       └── storage.ts
└── public/
    └── embed.js
```

## Related Code Files

### Create
- `/apps/chat-widget/src/App.tsx` - Main widget app
- `/apps/chat-widget/src/components/ChatWindow.tsx` - Chat UI
- `/apps/chat-widget/src/hooks/useWebSocket.ts` - WebSocket hook
- `/apps/chat-widget/public/embed.js` - Embed script
- `/apps/chat-widget/src/lib/markdown.ts` - Message formatting

## Implementation Steps

1. **Create Widget Application**
```typescript
// apps/chat-widget/src/App.tsx
import { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { useChat } from './hooks/useChat';

export default function ChatWidget() {
  const {
    messages,
    sendMessage,
    isConnected,
    isTyping
  } = useChat();

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h3 className="font-bold">Tư Vấn Pháp Luật AI</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          {isConnected ? 'Sẵn sàng' : 'Đang kết nối...'}
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow
        messages={messages}
        isTyping={isTyping}
        onSendMessage={sendMessage}
      />
    </div>
  );
}
```

2. **Chat Window Component**
```typescript
// apps/chat-widget/src/components/ChatWindow.tsx
export function ChatWindow({ messages, isTyping, onSendMessage }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputBar onSend={onSendMessage} />
    </div>
  );
}

function Message({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-900'
      } rounded-lg p-3`}>
        {/* Message Content */}
        <MessageContent content={message.content} />

        {/* Citations */}
        {message.citations && (
          <Citations citations={message.citations} />
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
```

3. **WebSocket Hook**
```typescript
// apps/chat-widget/src/hooks/useWebSocket.ts
export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(ws);
    };

    connect();

    return () => {
      socket?.close();
      clearTimeout(reconnectTimeout.current);
    };
  }, [url]);

  const send = useCallback((data: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }, [socket]);

  return { socket, isConnected, send };
}
```

4. **Chat Hook with Streaming**
```typescript
// apps/chat-widget/src/hooks/useChat.ts
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>();

  const { socket, isConnected, send } = useWebSocket(
    'wss://api.lawbot.vn/chat'
  );

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'conversation_started':
          setConversationId(data.conversationId);
          break;

        case 'message_start':
          setIsTyping(true);
          setMessages(prev => [...prev, {
            id: data.messageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now()
          }]);
          break;

        case 'message_chunk':
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.id === data.messageId) {
              lastMessage.content += data.content;
            }
            return newMessages;
          });
          break;

        case 'message_end':
          setIsTyping(false);
          if (data.citations) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage) {
                lastMessage.citations = data.citations;
              }
              return newMessages;
            });
          }
          break;
      }
    };
  }, [socket]);

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    // Send to server
    send({
      type: 'message',
      conversationId,
      content
    });
  };

  return {
    messages,
    sendMessage,
    isConnected,
    isTyping
  };
}
```

5. **Citation Display**
```typescript
// apps/chat-widget/src/components/Citations.tsx
export function Citations({ citations }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        <DocumentIcon className="w-4 h-4" />
        {citations.length} nguồn tham khảo
        <ChevronIcon className={`w-4 h-4 transform ${
          expanded ? 'rotate-180' : ''
        }`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {citations.map((citation, idx) => (
            <div
              key={idx}
              className="text-xs bg-gray-50 p-2 rounded"
            >
              <div className="font-semibold">
                {citation.law} - Điều {citation.article}
              </div>
              <div className="text-gray-600">
                Độ tin cậy: {(citation.confidence * 100).toFixed(0)}%
              </div>
              {citation.url && (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Xem chi tiết →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

6. **Input Bar with Features**
```typescript
// apps/chat-widget/src/components/InputBar.tsx
export function InputBar({ onSend }) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>();

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-3">
      {/* Quick Replies */}
      <QuickReplies
        onSelect={(text) => {
          setInput(text);
          handleSend();
        }}
      />

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <AttachIcon className="w-5 h-5" />
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập câu hỏi của bạn..."
          className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,.pdf"
        onChange={handleFileUpload}
      />
    </div>
  );
}
```

7. **Embed Script**
```javascript
// apps/chat-widget/public/embed.js
(function() {
  // Create container
  const container = document.createElement('div');
  container.id = 'lawbot-chat-widget';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    height: 600px;
    z-index: 9999;
    border: none;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    overflow: hidden;
  `;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://chat.lawbot.vn';
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
  `;

  container.appendChild(iframe);
  document.body.appendChild(container);

  // Handle messages from iframe
  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://chat.lawbot.vn') return;

    switch(event.data.type) {
      case 'resize':
        container.style.height = event.data.height + 'px';
        break;
      case 'close':
        container.style.display = 'none';
        break;
    }
  });
})();
```

## Todo List
- [ ] Setup widget project
- [ ] Create chat UI components
- [ ] Implement WebSocket connection
- [ ] Add streaming support
- [ ] Build citation display
- [ ] Create input features
- [ ] Add quick replies
- [ ] Implement file upload
- [ ] Create embed script
- [ ] Add offline queue
- [ ] Test cross-origin

## Success Criteria
- Widget loads <2s
- Streaming works smoothly
- Citations display properly
- Mobile responsive
- Works in iframe

## Risk Assessment
- **Risk**: CORS issues
- **Mitigation**: Proper headers, postMessage API
- **Risk**: WebSocket disconnections
- **Mitigation**: Auto-reconnect, message queue

## Security Considerations
- Origin validation
- XSS prevention
- Rate limiting
- Secure WebSocket (WSS)

## Next Steps
- Phase 08: Admin Dashboard
- Phase 09: Realtime Features