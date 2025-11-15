/**
 * WebSocket Client with Auto-reconnect
 * Handles connection management, heartbeat, and message queuing
 */
export class WebSocketClient {
    ws = null;
    config;
    state = 'disconnected';
    reconnectAttempts = 0;
    reconnectTimer = null;
    heartbeatTimer = null;
    messageQueue = [];
    listeners = new Map();
    constructor(config) {
        this.config = {
            maxReconnectAttempts: 5,
            reconnectInterval: 1000,
            heartbeatInterval: 30000,
            debug: false,
            ...config,
        };
    }
    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.state === 'connected' || this.state === 'connecting') {
            this.log('Already connected or connecting');
            return;
        }
        this.state = 'connecting';
        this.log(`Connecting to ${this.config.url}...`);
        try {
            const url = new URL(this.config.url);
            url.searchParams.set('userId', this.config.userId);
            this.ws = new WebSocket(url.toString());
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
        }
        catch (error) {
            this.log('Connection error:', error);
            this.scheduleReconnect();
        }
    }
    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        this.log('Disconnecting...');
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.state = 'disconnected';
        this.reconnectAttempts = 0;
    }
    /**
     * Send message to server
     */
    send(message) {
        if (this.state !== 'connected' || !this.ws) {
            this.log('Not connected, queuing message');
            this.messageQueue.push(message);
            return;
        }
        try {
            this.ws.send(JSON.stringify(message));
            this.log('Message sent:', message);
        }
        catch (error) {
            this.log('Send error:', error);
            this.messageQueue.push(message);
        }
    }
    /**
     * Subscribe to message type
     */
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(callback);
    }
    /**
     * Unsubscribe from message type
     */
    off(type, callback) {
        const listeners = this.listeners.get(type);
        if (listeners) {
            listeners.delete(callback);
        }
    }
    /**
     * Get current connection state
     */
    getState() {
        return this.state;
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.state === 'connected';
    }
    /**
     * Handle WebSocket open event
     */
    handleOpen() {
        this.log('Connected');
        this.state = 'connected';
        this.reconnectAttempts = 0;
        // Start heartbeat
        this.startHeartbeat();
        // Process queued messages
        this.processMessageQueue();
        // Emit connected event
        this.emit('connected', { timestamp: new Date().toISOString() });
    }
    /**
     * Handle WebSocket message event
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.log('Message received:', message);
            // Handle pong response
            if (message.type === 'pong') {
                return;
            }
            // Emit message to listeners
            this.emit(message.type, message.data || message);
            this.emit('message', message);
        }
        catch (error) {
            this.log('Message parse error:', error);
        }
    }
    /**
     * Handle WebSocket error event
     */
    handleError(error) {
        this.log('WebSocket error:', error);
        this.emit('error', error);
    }
    /**
     * Handle WebSocket close event
     */
    handleClose(event) {
        this.log(`Connection closed: ${event.code} - ${event.reason}`);
        this.state = 'disconnected';
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        this.emit('disconnected', {
            code: event.code,
            reason: event.reason,
        });
        // Attempt reconnect if not a normal closure
        if (event.code !== 1000) {
            this.scheduleReconnect();
        }
    }
    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.log('Max reconnect attempts reached');
            this.emit('max_reconnect_attempts', {
                attempts: this.reconnectAttempts,
            });
            return;
        }
        this.state = 'reconnecting';
        this.reconnectAttempts++;
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
        this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }
    /**
     * Start heartbeat ping
     */
    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        this.heartbeatTimer = setInterval(() => {
            if (this.state === 'connected' && this.ws) {
                this.send({
                    type: 'ping',
                    timestamp: new Date().toISOString(),
                });
            }
        }, this.config.heartbeatInterval);
    }
    /**
     * Process queued messages
     */
    processMessageQueue() {
        if (this.messageQueue.length === 0) {
            return;
        }
        this.log(`Processing ${this.messageQueue.length} queued messages`);
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                this.send(message);
            }
        }
    }
    /**
     * Emit event to listeners
     */
    emit(type, data) {
        const listeners = this.listeners.get(type);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                }
                catch (error) {
                    this.log(`Listener error for ${type}:`, error);
                }
            });
        }
    }
    /**
     * Log debug messages
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[WebSocketClient]', ...args);
        }
    }
}
