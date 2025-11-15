/**
 * Webhook routes for platform integrations
 */
import { Hono } from 'hono';
import { rateLimitByIp } from '../middleware/ratelimit';
const webhooks = new Hono();
// Rate limiting for webhooks
const webhookRateLimit = rateLimitByIp({ windowMs: 60000, max: 200 });
/**
 * Verify webhook signature (HMAC SHA-256)
 */
async function verifySignature(payload, signature, secret) {
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const data = encoder.encode(payload);
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
        const signatureArray = new Uint8Array(signatureBuffer);
        let binaryString = '';
        for (let i = 0; i < signatureArray.length; i++) {
            binaryString += String.fromCharCode(signatureArray[i]);
        }
        const computedSignature = btoa(binaryString);
        return computedSignature === signature;
    }
    catch {
        return false;
    }
}
/**
 * POST /api/v1/webhooks/zalo
 * Handle Zalo OA webhooks
 */
webhooks.post('/zalo', webhookRateLimit, async (c) => {
    const signature = c.req.header('X-ZEvent-Signature');
    const body = await c.req.text();
    // Verify signature
    if (signature) {
        const isValid = await verifySignature(body, signature, c.env.ZALO_APP_SECRET);
        if (!isValid) {
            return c.json({ error: 'Invalid signature' }, 401);
        }
    }
    try {
        const payload = JSON.parse(body);
        // Queue webhook for processing
        await c.env.WEBHOOK_QUEUE.send({
            platform: 'zalo',
            event: payload.event_name,
            timestamp: Date.now(),
            data: payload,
        });
        // Log webhook
        console.log('[Zalo Webhook]', {
            event: payload.event_name,
            timestamp: new Date().toISOString(),
        });
        return c.json({ success: true });
    }
    catch (error) {
        console.error('[Zalo Webhook Error]', error);
        return c.json({ error: 'Invalid payload' }, 400);
    }
});
/**
 * GET /api/v1/webhooks/facebook
 * Facebook webhook verification
 */
webhooks.get('/facebook', async (c) => {
    const mode = c.req.query('hub.mode');
    const token = c.req.query('hub.verify_token');
    const challenge = c.req.query('hub.challenge');
    // Verify webhook
    if (mode === 'subscribe' && token === c.env.FB_VERIFY_TOKEN) {
        console.log('[Facebook Webhook] Verification successful');
        return c.text(challenge || '');
    }
    return c.json({ error: 'Verification failed' }, 403);
});
/**
 * POST /api/v1/webhooks/facebook
 * Handle Facebook Messenger webhooks
 */
webhooks.post('/facebook', webhookRateLimit, async (c) => {
    const signature = c.req.header('X-Hub-Signature-256');
    const body = await c.req.text();
    // Verify signature
    if (signature) {
        const expectedSignature = signature.replace('sha256=', '');
        const isValid = await verifySignature(body, expectedSignature, c.env.FB_APP_SECRET);
        if (!isValid) {
            return c.json({ error: 'Invalid signature' }, 401);
        }
    }
    try {
        const payload = JSON.parse(body);
        // Process webhook entries
        if (payload.object === 'page') {
            for (const entry of payload.entry) {
                // Queue each messaging event
                if (entry.messaging) {
                    for (const event of entry.messaging) {
                        await c.env.WEBHOOK_QUEUE.send({
                            platform: 'facebook',
                            event: Object.keys(event).find(k => k !== 'sender' && k !== 'recipient') || 'unknown',
                            timestamp: event.timestamp || Date.now(),
                            data: {
                                senderId: event.sender?.id,
                                recipientId: event.recipient?.id,
                                ...event,
                            },
                        });
                    }
                }
            }
            // Log webhook
            console.log('[Facebook Webhook]', {
                entries: payload.entry.length,
                timestamp: new Date().toISOString(),
            });
        }
        return c.json({ success: true });
    }
    catch (error) {
        console.error('[Facebook Webhook Error]', error);
        return c.json({ error: 'Invalid payload' }, 400);
    }
});
/**
 * POST /api/v1/webhooks/test
 * Test webhook endpoint (development only)
 */
webhooks.post('/test', async (c) => {
    const body = await c.req.json();
    // Queue test webhook
    await c.env.WEBHOOK_QUEUE.send({
        platform: 'test',
        event: 'test_event',
        timestamp: Date.now(),
        data: body,
    });
    return c.json({
        success: true,
        message: 'Test webhook queued',
        data: body,
    });
});
export default webhooks;
