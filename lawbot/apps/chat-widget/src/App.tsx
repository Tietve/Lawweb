import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';

export default function App() {
  const {
    messages,
    sendMessage,
    isConnected,
    isTyping,
  } = useChat();

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <h3 className="font-bold text-lg">Tư Vấn Pháp Luật AI</h3>
        <div className="flex items-center gap-2 text-sm mt-1">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span>{isConnected ? 'Sẵn sàng' : 'Đang kết nối...'}</span>
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow
        messages={messages}
        isTyping={isTyping}
        onSendMessage={sendMessage}
        isConnected={isConnected}
      />
    </div>
  );
}
