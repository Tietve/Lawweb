/**
 * PresenceTracker Durable Object
 * Tracks user presence and online status
 * Uses heartbeat system with 30s interval
 */
export class PresenceTracker {
    state;
    env;
    presences;
    HEARTBEAT_INTERVAL = 30000; // 30 seconds
    STALE_THRESHOLD = 90000; // 90 seconds (3 missed heartbeats)
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.presences = new Map();
        // Restore state from storage
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get('presences');
            if (stored) {
                this.presences = new Map(stored);
            }
            // Schedule cleanup alarm every 30 seconds
            await this.state.storage.setAlarm(Date.now() + this.HEARTBEAT_INTERVAL);
        });
    }
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        try {
            switch (true) {
                case path === '/update' && request.method === 'POST':
                    return await this.handleUpdate(request);
                case path === '/list' && request.method === 'GET':
                    return this.handleList(url);
                case path === '/cleanup' && request.method === 'POST':
                    return await this.handleCleanup();
                case path === '/heartbeat' && request.method === 'POST':
                    return await this.handleHeartbeat(request);
                default:
                    return new Response('Not found', { status: 404 });
            }
        }
        catch (error) {
            return Response.json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, { status: 500 });
        }
    }
    /**
     * Update user presence
     */
    async handleUpdate(request) {
        const update = await request.json();
        if (!update.userId) {
            return Response.json({ success: false, error: 'Missing userId' }, { status: 400 });
        }
        const existing = this.presences.get(update.userId);
        const presence = {
            userId: update.userId,
            status: update.status || existing?.status || 'online',
            lastSeen: new Date().toISOString(),
            metadata: { ...existing?.metadata, ...update.metadata },
        };
        this.presences.set(update.userId, presence);
        await this.persistState();
        // Broadcast presence update to notification hub
        await this.broadcastPresenceUpdate(presence);
        return Response.json({
            success: true,
            presence,
        });
    }
    /**
     * Handle heartbeat from client
     */
    async handleHeartbeat(request) {
        const { userId } = await request.json();
        if (!userId) {
            return Response.json({ success: false, error: 'Missing userId' }, { status: 400 });
        }
        const existing = this.presences.get(userId);
        if (existing) {
            existing.lastSeen = new Date().toISOString();
            existing.status = 'online';
            this.presences.set(userId, existing);
            await this.persistState();
        }
        return Response.json({
            success: true,
            nextHeartbeat: this.HEARTBEAT_INTERVAL,
        });
    }
    /**
     * List active presences with optional filtering
     */
    handleList(url) {
        const status = url.searchParams.get('status');
        let presences = Array.from(this.presences.values());
        if (status) {
            presences = presences.filter(p => p.status === status);
        }
        return Response.json({
            presences,
            total: presences.length,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Manual cleanup trigger
     */
    async handleCleanup() {
        const cleaned = await this.cleanupStalePresences();
        return Response.json({
            success: true,
            cleaned,
            remaining: this.presences.size,
        });
    }
    /**
     * Alarm handler - cleanup stale presences
     */
    async alarm() {
        try {
            await this.cleanupStalePresences();
            // Schedule next cleanup
            await this.state.storage.setAlarm(Date.now() + this.HEARTBEAT_INTERVAL);
        }
        catch (error) {
            console.error('Error in presence cleanup alarm:', error);
        }
    }
    /**
     * Clean up stale presences (no heartbeat for 90s)
     */
    async cleanupStalePresences() {
        const now = Date.now();
        let cleaned = 0;
        const updates = [];
        for (const [userId, presence] of this.presences.entries()) {
            const lastSeen = new Date(presence.lastSeen).getTime();
            const elapsed = now - lastSeen;
            if (elapsed > this.STALE_THRESHOLD) {
                // Mark as offline instead of removing
                presence.status = 'offline';
                presence.lastSeen = new Date().toISOString();
                this.presences.set(userId, presence);
                updates.push(presence);
                cleaned++;
            }
            else if (elapsed > this.HEARTBEAT_INTERVAL * 2 && presence.status === 'online') {
                // Mark as away if 2 heartbeats missed but not yet stale
                presence.status = 'away';
                this.presences.set(userId, presence);
                updates.push(presence);
            }
        }
        if (cleaned > 0 || updates.length > 0) {
            await this.persistState();
            // Broadcast presence updates
            for (const presence of updates) {
                await this.broadcastPresenceUpdate(presence);
            }
        }
        return cleaned;
    }
    /**
     * Broadcast presence update to notification hub
     */
    async broadcastPresenceUpdate(presence) {
        try {
            if (!this.env.NOTIFICATION_HUB) {
                return;
            }
            const id = this.env.NOTIFICATION_HUB.idFromName('global');
            const stub = this.env.NOTIFICATION_HUB.get(id);
            await stub.fetch('https://notification-hub/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'presence_update',
                    data: presence,
                    timestamp: new Date().toISOString(),
                }),
            });
        }
        catch (error) {
            console.error('Error broadcasting presence update:', error);
        }
    }
    /**
     * Persist state to storage
     */
    async persistState() {
        await this.state.storage.put('presences', Array.from(this.presences.entries()));
    }
}
