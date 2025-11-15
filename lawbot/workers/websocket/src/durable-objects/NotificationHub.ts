/**
 * NotificationHub Durable Object
 * Manages WebSocket connections for real-time admin notifications
 * Uses hibernation API for cost-effective connection management
 */

export interface NotificationMessage {
  type: 'chat_assigned' | 'escalation' | 'new_message' | 'presence_update' | 'system_alert';
  data: unknown;
  timestamp: string;
  userId?: string;
}

export interface Session {
  userId: string;
  connectedAt: string;
  lastActivity: string;
  metadata: Record<string, unknown>;
}

export class NotificationHub implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, Session>;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.sessions = new Map();

    // Restore sessions from storage on initialization
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<Map<WebSocket, Session>>('sessions');
      if (stored) {
        this.sessions = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
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
  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response('Missing userId parameter', { status: 400 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept WebSocket with hibernation
    this.state.acceptWebSocket(server);

    // Store session data
    const session: Session = {
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
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const session = this.sessions.get(ws);
      if (!session) return;

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
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event (hibernation API)
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    console.log(`WebSocket closed: ${code} - ${reason}`);

    this.sessions.delete(ws);
    await this.persistSessions();
  }

  /**
   * Handle WebSocket error event (hibernation API)
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);

    this.sessions.delete(ws);
    await this.persistSessions();
  }

  /**
   * Broadcast message to all connected clients
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const notification: NotificationMessage = await request.json();

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
        } catch (error) {
          console.error('Error sending to WebSocket:', error);
        }
      }

      return Response.json({
        success: true,
        sent,
        total: connections.length,
      });
    } catch (error) {
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  }

  /**
   * Get current statistics
   */
  private handleStats(): Response {
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
  private async persistSessions(): Promise<void> {
    await this.state.storage.put('sessions', this.sessions);
  }

  /**
   * Cleanup stale connections (called periodically)
   */
  async alarm(): Promise<void> {
    const now = Date.now();
    const STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const connections = this.state.getWebSockets();

    for (const ws of connections) {
      const session = this.sessions.get(ws);
      if (!session) continue;

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
