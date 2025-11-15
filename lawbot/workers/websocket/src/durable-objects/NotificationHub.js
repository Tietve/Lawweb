/**
 * NotificationHub Durable Object
 * Manages WebSocket connections for real-time admin notifications
 * Uses hibernation API for cost-effective connection management
 */
export class NotificationHub {
    state;
    sessions;
    env;
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Map();
        // Restore sessions from storage on initialization
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get('sessions');
            if (stored) {
                this.sessions = stored;
            }
        });
    }
    async fetch(request) {
        const url = new URL(request.url);
        // WebSocket upgrade handling
        if (request.headers.get('Upgrade') === 'websocket') {
            return this.handleWebSocketUpgrade(request);
        }
        // REST endpoints for broadcasting
        if (url.pathname === '/broadcast' && request.method === 'POST') {
            return this.handleBroadcast(request);
        }
        if (url.pathname === '/stats' && request.method === 'GET') {
            return this.handleStats();
        }
        return new Response('Not found', { status: 404 });
    }
    /**
     * Handle WebSocket upgrade with hibernation API
     */
    async handleWebSocketUpgrade(request) {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        if (!userId) {
            return new Response('Missing userId parameter', { status: 400 });
        }
        // Create WebSocket pair
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        // Accept WebSocket with hibernation
        this.state.acceptWebSocket(server);
        // Store session data
        const session = {
            userId,
            connectedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            metadata: {},
        };
        this.sessions.set(server, session);
        await this.persistSessions();
        // Send welcome message
        server.send(JSON.stringify({
            type: 'connected',
            userId,
            timestamp: new Date().toISOString(),
        }));
        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }
    /**
     * Handle incoming WebSocket messages (hibernation API)
     */
    async webSocketMessage(ws, message) {
        try {
            const session = this.sessions.get(ws);
            if (!session)
                return;
            // Update last activity
            session.lastActivity = new Date().toISOString();
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            // Handle ping/pong for heartbeat
            if (data.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                return;
            }
            // Handle other message types
            console.log('Received message:', data);
        }
        catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }
    /**
     * Handle WebSocket close event (hibernation API)
     */
    async webSocketClose(ws, code, reason) {
        console.log(`WebSocket closed: ${code} - ${reason}`);
        this.sessions.delete(ws);
        await this.persistSessions();
    }
    /**
     * Handle WebSocket error event (hibernation API)
     */
    async webSocketError(ws, error) {
        console.error('WebSocket error:', error);
        this.sessions.delete(ws);
        await this.persistSessions();
    }
    /**
     * Broadcast message to all connected clients
     */
    async handleBroadcast(request) {
        try {
            const notification = await request.json();
            const connections = this.state.getWebSockets();
            let sent = 0;
            for (const ws of connections) {
                const session = this.sessions.get(ws);
                // Filter by userId if specified
                if (notification.userId && session?.userId !== notification.userId) {
                    continue;
                }
                try {
                    ws.send(JSON.stringify(notification));
                    sent++;
                }
                catch (error) {
                    console.error('Error sending to WebSocket:', error);
                }
            }
            return Response.json({
                success: true,
                sent,
                total: connections.length,
            });
        }
        catch (error) {
            return Response.json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, { status: 500 });
        }
    }
    /**
     * Get current statistics
     */
    handleStats() {
        const connections = this.state.getWebSockets();
        return Response.json({
            activeConnections: connections.length,
            sessions: Array.from(this.sessions.values()),
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Persist sessions to storage
     */
    async persistSessions() {
        await this.state.storage.put('sessions', this.sessions);
    }
    /**
     * Cleanup stale connections (called periodically)
     */
    async alarm() {
        const now = Date.now();
        const STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        const connections = this.state.getWebSockets();
        for (const ws of connections) {
            const session = this.sessions.get(ws);
            if (!session)
                continue;
            const lastActivity = new Date(session.lastActivity).getTime();
            if (now - lastActivity > STALE_TIMEOUT) {
                ws.close(1000, 'Connection stale');
                this.sessions.delete(ws);
            }
        }
        await this.persistSessions();
        // Schedule next cleanup in 1 minute
        await this.state.storage.setAlarm(Date.now() + 60 * 1000);
    }
}
