/**
 * ChatOrchestrator Durable Object
 * Manages chat session assignments, transfers, and escalations
 * Coordinates between AI agents and human support
 */
export class ChatOrchestrator {
    state;
    env;
    sessions;
    agentWorkload; // Track agent workload
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Map();
        this.agentWorkload = new Map();
        // Restore state from storage
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get('orchestrator');
            if (stored) {
                this.sessions = new Map(stored.sessions);
                this.agentWorkload = new Map(stored.agentWorkload);
            }
        });
    }
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        try {
            switch (true) {
                case path === '/assign' && request.method === 'POST':
                    return await this.handleAssign(request);
                case path === '/transfer' && request.method === 'POST':
                    return await this.handleTransfer(request);
                case path === '/escalate' && request.method === 'POST':
                    return await this.handleEscalate(request);
                case path === '/status' && request.method === 'GET':
                    return this.handleStatus(url);
                case path === '/resolve' && request.method === 'POST':
                    return await this.handleResolve(request);
                case path === '/workload' && request.method === 'GET':
                    return this.handleWorkload();
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
     * Assign chat session to an agent
     */
    async handleAssign(request) {
        const assignReq = await request.json();
        if (!assignReq.sessionId || !assignReq.userId || !assignReq.agentId) {
            return Response.json({
                success: false,
                error: 'Missing required fields',
            }, { status: 400 });
        }
        const existing = this.sessions.get(assignReq.sessionId);
        const now = new Date().toISOString();
        const session = {
            sessionId: assignReq.sessionId,
            userId: assignReq.userId,
            status: 'assigned',
            assignedTo: assignReq.agentId,
            agentType: assignReq.agentType,
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            metadata: { ...existing?.metadata, ...assignReq.metadata },
        };
        this.sessions.set(assignReq.sessionId, session);
        // Update agent workload
        const currentWorkload = this.agentWorkload.get(assignReq.agentId) || 0;
        this.agentWorkload.set(assignReq.agentId, currentWorkload + 1);
        await this.persistState();
        // Notify admin of assignment
        await this.notifyAdmins({
            type: 'chat_assigned',
            data: session,
            timestamp: now,
        });
        // Track analytics
        await this.incrementMetric('chat_assignments');
        return Response.json({
            success: true,
            session,
        });
    }
    /**
     * Transfer chat session between agents
     */
    async handleTransfer(request) {
        const transferReq = await request.json();
        const session = this.sessions.get(transferReq.sessionId);
        if (!session) {
            return Response.json({
                success: false,
                error: 'Session not found',
            }, { status: 404 });
        }
        if (session.assignedTo !== transferReq.fromAgentId) {
            return Response.json({
                success: false,
                error: 'Session not assigned to specified agent',
            }, { status: 400 });
        }
        // Update session
        session.assignedTo = transferReq.toAgentId;
        session.updatedAt = new Date().toISOString();
        session.metadata = {
            ...session.metadata,
            transferReason: transferReq.reason,
            transferredAt: new Date().toISOString(),
        };
        this.sessions.set(transferReq.sessionId, session);
        // Update workloads
        const fromWorkload = this.agentWorkload.get(transferReq.fromAgentId) || 0;
        this.agentWorkload.set(transferReq.fromAgentId, Math.max(0, fromWorkload - 1));
        const toWorkload = this.agentWorkload.get(transferReq.toAgentId) || 0;
        this.agentWorkload.set(transferReq.toAgentId, toWorkload + 1);
        await this.persistState();
        // Track analytics
        await this.incrementMetric('chat_transfers');
        return Response.json({
            success: true,
            session,
        });
    }
    /**
     * Escalate chat session to human support
     */
    async handleEscalate(request) {
        const escalationReq = await request.json();
        const session = this.sessions.get(escalationReq.sessionId);
        if (!session) {
            return Response.json({
                success: false,
                error: 'Session not found',
            }, { status: 404 });
        }
        const now = new Date().toISOString();
        // Update session
        session.status = 'escalated';
        session.escalatedAt = now;
        session.updatedAt = now;
        session.agentType = 'human';
        session.assignedTo = null; // Will be assigned to available human agent
        session.metadata = {
            ...session.metadata,
            escalationReason: escalationReq.reason,
            escalationPriority: escalationReq.priority || 'medium',
            ...escalationReq.metadata,
        };
        this.sessions.set(escalationReq.sessionId, session);
        await this.persistState();
        // Notify admins of escalation
        await this.notifyAdmins({
            type: 'escalation',
            data: {
                session,
                reason: escalationReq.reason,
                priority: escalationReq.priority,
            },
            timestamp: now,
        });
        // Track analytics
        await this.incrementMetric('chat_escalations');
        return Response.json({
            success: true,
            session,
            message: 'Session escalated to human support',
        });
    }
    /**
     * Get session status
     */
    handleStatus(url) {
        const sessionId = url.searchParams.get('sessionId');
        if (sessionId) {
            const session = this.sessions.get(sessionId);
            if (!session) {
                return Response.json({
                    success: false,
                    error: 'Session not found',
                }, { status: 404 });
            }
            return Response.json({ session });
        }
        // Return all sessions
        const sessions = Array.from(this.sessions.values());
        return Response.json({
            sessions,
            total: sessions.length,
            byStatus: this.groupByStatus(sessions),
        });
    }
    /**
     * Resolve and close chat session
     */
    async handleResolve(request) {
        const { sessionId } = await request.json();
        const session = this.sessions.get(sessionId);
        if (!session) {
            return Response.json({
                success: false,
                error: 'Session not found',
            }, { status: 404 });
        }
        const now = new Date().toISOString();
        session.status = 'resolved';
        session.resolvedAt = now;
        session.updatedAt = now;
        // Update agent workload
        if (session.assignedTo) {
            const workload = this.agentWorkload.get(session.assignedTo) || 0;
            this.agentWorkload.set(session.assignedTo, Math.max(0, workload - 1));
        }
        this.sessions.set(sessionId, session);
        await this.persistState();
        // Track analytics
        await this.incrementMetric('chat_resolutions');
        return Response.json({
            success: true,
            session,
        });
    }
    /**
     * Get agent workload statistics
     */
    handleWorkload() {
        const workload = Array.from(this.agentWorkload.entries()).map(([agentId, count]) => ({
            agentId,
            activeChats: count,
        }));
        return Response.json({
            workload,
            totalActive: Array.from(this.agentWorkload.values()).reduce((a, b) => a + b, 0),
        });
    }
    /**
     * Group sessions by status
     */
    groupByStatus(sessions) {
        const grouped = {};
        for (const session of sessions) {
            grouped[session.status] = (grouped[session.status] || 0) + 1;
        }
        return grouped;
    }
    /**
     * Notify admins via notification hub
     */
    async notifyAdmins(message) {
        try {
            if (!this.env.NOTIFICATION_HUB)
                return;
            const id = this.env.NOTIFICATION_HUB.idFromName('global');
            const stub = this.env.NOTIFICATION_HUB.get(id);
            await stub.fetch('https://notification-hub/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });
        }
        catch (error) {
            console.error('Error notifying admins:', error);
        }
    }
    /**
     * Increment analytics metric
     */
    async incrementMetric(name) {
        try {
            if (!this.env.ANALYTICS_AGGREGATOR)
                return;
            const id = this.env.ANALYTICS_AGGREGATOR.idFromName('global');
            const stub = this.env.ANALYTICS_AGGREGATOR.get(id);
            await stub.fetch('https://analytics/increment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, value: 1 }),
            });
        }
        catch (error) {
            console.error('Error incrementing metric:', error);
        }
    }
    /**
     * Persist state to storage
     */
    async persistState() {
        await this.state.storage.put('orchestrator', {
            sessions: Array.from(this.sessions.entries()),
            agentWorkload: Array.from(this.agentWorkload.entries()),
        });
    }
}
