import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'preact/hooks';
import { Citations } from './Citations';
import { InputBar } from './InputBar';
import { formatTime } from '../lib/utils';
export function ChatWindow({ messages, isTyping, onSendMessage, isConnected, }) {
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);
    return (_jsxs("div", { class: "flex-1 flex flex-col min-h-0", children: [_jsxs("div", { class: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.length === 0 && (_jsxs("div", { class: "text-center text-gray-500 mt-8", children: [_jsx("div", { class: "text-4xl mb-2", children: "\uD83D\uDC4B" }), _jsx("div", { class: "text-lg font-semibold mb-1", children: "Ch\u00E0o m\u1EEBng \u0111\u1EBFn v\u1EDBi LawBot" }), _jsx("div", { class: "text-sm", children: "H\u1ECFi t\u00F4i b\u1EA5t k\u1EF3 c\u00E2u h\u1ECFi ph\u00E1p l\u00FD n\u00E0o" })] })), messages.map(msg => (_jsx(MessageBubble, { message: msg }, msg.id))), isTyping && _jsx(TypingIndicator, {}), _jsx("div", { ref: messagesEndRef })] }), _jsx(InputBar, { onSend: onSendMessage, disabled: !isConnected })] }));
}
function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    return (_jsx("div", { class: `flex ${isUser ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { class: `max-w-[80%] ${isUser
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'} rounded-lg p-3`, children: [_jsx("div", { class: "whitespace-pre-wrap break-words", children: message.content }), message.citations && message.citations.length > 0 && (_jsx(Citations, { citations: message.citations })), _jsx("div", { class: `text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`, children: formatTime(message.timestamp) })] }) }));
}
function TypingIndicator() {
    return (_jsx("div", { class: "flex justify-start", children: _jsx("div", { class: "bg-gray-100 rounded-lg p-3", children: _jsxs("div", { class: "flex items-center gap-1", children: [_jsx("div", { class: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { class: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { class: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) }) }));
}
