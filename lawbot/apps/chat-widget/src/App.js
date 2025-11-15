import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
export default function App() {
    const { messages, sendMessage, isConnected, isTyping, } = useChat();
    return (_jsxs("div", { class: "h-screen flex flex-col bg-white", children: [_jsxs("div", { class: "bg-blue-600 text-white p-4 shadow-lg", children: [_jsx("h3", { class: "font-bold text-lg", children: "T\u01B0 V\u1EA5n Ph\u00E1p Lu\u1EADt AI" }), _jsxs("div", { class: "flex items-center gap-2 text-sm mt-1", children: [_jsx("span", { class: `w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}` }), _jsx("span", { children: isConnected ? 'Sẵn sàng' : 'Đang kết nối...' })] })] }), _jsx(ChatWindow, { messages: messages, isTyping: isTyping, onSendMessage: sendMessage, isConnected: isConnected })] }));
}
