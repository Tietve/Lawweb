/**
 * Node.js WebSocket Client Example
 * Demonstrates usage of WebSocket client and REST API calls
 */
// Note: In production, install 'ws' package: npm install ws
// import WebSocket from 'ws';
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';
const USER_ID = process.env.USER_ID || 'admin-123';
/**
 * Example: Analytics tracking
 */
async function trackAnalytics() {
    console.log('=== Analytics Example ===');
    // Increment metrics
    const metrics = ['chat_messages', 'user_queries', 'escalations'];
    for (const metric of metrics) {
        const response = await fetch(`${WORKER_URL}/api/analytics/increment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: metric, value: 1 }),
        });
        const result = await response.json();
        console.log(`Incremented ${metric}:`, result);
    }
    // Get stats
    const statsResponse = await fetch(`${WORKER_URL}/api/analytics/stats`);
    const stats = await statsResponse.json();
    console.log('Analytics stats:', stats);
    // Get all metrics
    const metricsResponse = await fetch(`${WORKER_URL}/api/analytics/metrics`);
    const allMetrics = await metricsResponse.json();
    console.log('All metrics:', allMetrics);
}
/**
 * Example: Presence tracking
 */
async function trackPresence() {
    console.log('\n=== Presence Example ===');
    // Update presence
    const updateResponse = await fetch(`${WORKER_URL}/api/presence/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: USER_ID,
            status: 'online',
            metadata: { location: 'dashboard', device: 'desktop' },
        }),
    });
    const updateResult = await updateResponse.json();
    console.log('Presence updated:', updateResult);
    // Send heartbeat
    const heartbeatResponse = await fetch(`${WORKER_URL}/api/presence/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID }),
    });
    const heartbeatResult = await heartbeatResponse.json();
    console.log('Heartbeat sent:', heartbeatResult);
    // List all presences
    const listResponse = await fetch(`${WORKER_URL}/api/presence/list`);
    const presences = await listResponse.json();
    console.log('Active presences:', presences);
    // List only online users
    const onlineResponse = await fetch(`${WORKER_URL}/api/presence/list?status=online`);
    const onlinePresences = await onlineResponse.json();
    console.log('Online users:', onlinePresences);
}
/**
 * Example: Chat orchestration
 */
async function orchestrateChat() {
    console.log('\n=== Chat Orchestration Example ===');
    const sessionId = `session-${Date.now()}`;
    // Assign chat to AI agent
    const assignResponse = await fetch(`${WORKER_URL}/api/chat/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId,
            userId: 'user-456',
            agentId: 'agent-ai-1',
            agentType: 'ai',
            metadata: { topic: 'legal_advice', language: 'vi' },
        }),
    });
    const assignResult = await assignResponse.json();
    console.log('Chat assigned:', assignResult);
    // Get session status
    const statusResponse = await fetch(`${WORKER_URL}/api/chat/status?sessionId=${sessionId}`);
    const status = await statusResponse.json();
    console.log('Session status:', status);
    // Escalate to human
    const escalateResponse = await fetch(`${WORKER_URL}/api/chat/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId,
            reason: 'Complex legal question requiring human expertise',
            priority: 'high',
            metadata: { complexity: 'high', domain: 'corporate_law' },
        }),
    });
    const escalateResult = await escalateResponse.json();
    console.log('Chat escalated:', escalateResult);
    // Get agent workload
    const workloadResponse = await fetch(`${WORKER_URL}/api/chat/workload`);
    const workload = await workloadResponse.json();
    console.log('Agent workload:', workload);
    // Resolve session
    const resolveResponse = await fetch(`${WORKER_URL}/api/chat/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
    });
    const resolveResult = await resolveResponse.json();
    console.log('Chat resolved:', resolveResult);
}
/**
 * Example: Broadcast notifications
 */
async function broadcastNotifications() {
    console.log('\n=== Notifications Example ===');
    // Broadcast to all connected clients
    const broadcastResponse = await fetch(`${WORKER_URL}/api/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'system_alert',
            data: {
                title: 'System Maintenance',
                message: 'Scheduled maintenance in 10 minutes',
                severity: 'warning',
            },
            timestamp: new Date().toISOString(),
        }),
    });
    const broadcastResult = await broadcastResponse.json();
    console.log('Notification broadcast:', broadcastResult);
    // Broadcast to specific user
    const userBroadcastResponse = await fetch(`${WORKER_URL}/api/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'chat_assigned',
            userId: USER_ID,
            data: {
                sessionId: 'session-123',
                agentId: 'agent-human-1',
            },
            timestamp: new Date().toISOString(),
        }),
    });
    const userBroadcastResult = await userBroadcastResponse.json();
    console.log('User notification sent:', userBroadcastResult);
    // Get notification stats
    const statsResponse = await fetch(`${WORKER_URL}/api/notifications/stats`);
    const stats = await statsResponse.json();
    console.log('Notification stats:', stats);
}
/**
 * Main execution
 */
async function main() {
    try {
        await trackAnalytics();
        await trackPresence();
        await orchestrateChat();
        await broadcastNotifications();
        console.log('\n=== All examples completed successfully ===');
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    main();
}
export { trackAnalytics, trackPresence, orchestrateChat, broadcastNotifications };
