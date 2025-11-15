import { useRef, useEffect } from 'preact/hooks';
import { Message } from '../types';
import { Citations } from './Citations';
import { InputBar } from './InputBar';
import { formatTime } from '../lib/utils';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  isConnected: boolean;
}

export function ChatWindow({
  messages,
  isTyping,
  onSendMessage,
  isConnected,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">👋</div>
            <div className="text-lg font-semibold mb-1">
              Chào mừng đến với LawBot
            </div>
            <div className="text-sm">
              Hỏi tôi bất kỳ câu hỏi pháp lý nào
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputBar onSend={onSendMessage} disabled={!isConnected} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        } rounded-lg p-3`}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <Citations citations={message.citations} />
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-lg p-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
        </div>
      </div>
    </div>
  );
}
