import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
export function useWebSocket({ url, onMessage, reconnectInterval = 3000, maxReconnectAttempts = 5, }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const reconnectTimeoutRef = useRef();
    const socketRef = useRef(null);
    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(url);
            socketRef.current = ws;
            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setReconnectAttempts(0);
            };
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage?.(data);
                }
                catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };
            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                socketRef.current = null;
                // Attempt to reconnect
                if (reconnectAttempts < maxReconnectAttempts) {
                    const timeout = reconnectInterval * Math.pow(2, reconnectAttempts);
                    console.log(`Reconnecting in ${timeout}ms...`);
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        setReconnectAttempts(prev => prev + 1);
                        connect();
                    }, timeout);
                }
            };
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            setSocket(ws);
        }
        catch (err) {
            console.error('Failed to create WebSocket:', err);
        }
    }, [url, onMessage, reconnectInterval, reconnectAttempts, maxReconnectAttempts]);
    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect]);
    const send = useCallback((data) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
            return true;
        }
        console.warn('WebSocket is not connected');
        return false;
    }, []);
    return {
        socket,
        isConnected,
        send,
        reconnectAttempts,
    };
}
