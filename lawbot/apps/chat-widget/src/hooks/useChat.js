import { useState, useCallback } from 'preact/hooks';
import { useWebSocket } from './useWebSocket';
import { generateId } from '../lib/utils';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787/chat';
export function useChat() {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState();
    const handleMessage = useCallback((data) => {
        switch (data.type) {
            case 'conversation_started':
                if (data.conversationId) {
                    setConversationId(data.conversationId);
                    console.log('Conversation started:', data.conversationId);
                }
                break;
            case 'message_start':
                setIsTyping(true);
                setMessages(prev => [
                    ...prev,
                    {
                        id: data.messageId || generateId(),
                        role: 'assistant',
                        content: '',
                        timestamp: Date.now(),
                    },
                ]);
                break;
            case 'message_chunk':
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                        lastMessage.content += data.content || '';
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
                        if (lastMessage && lastMessage.role === 'assistant') {
                            lastMessage.citations = data.citations;
                        }
                        return newMessages;
                    });
                }
                break;
            case 'error':
                setIsTyping(false);
                console.error('Chat error:', data.error);
                // Add error message to chat
                setMessages(prev => [
                    ...prev,
                    {
                        id: generateId(),
                        role: 'assistant',
                        content: `Lỗi: ${data.error || 'Đã xảy ra lỗi. Vui lòng thử lại.'}`,
                        timestamp: Date.now(),
                    },
                ]);
                break;
        }
    }, []);
    const { isConnected, send } = useWebSocket({
        url: WS_URL,
        onMessage: handleMessage,
    });
    const sendMessage = useCallback((content) => {
        if (!content.trim())
            return;
        // Add user message to chat
        const userMessage = {
            id: generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        // Send to server
        send({
            type: 'message',
            conversationId,
            content: content.trim(),
        });
    }, [conversationId, send]);
    const clearMessages = useCallback(() => {
        setMessages([]);
        setConversationId(undefined);
    }, []);
    return {
        messages,
        sendMessage,
        clearMessages,
        isConnected,
        isTyping,
        conversationId,
    };
}
