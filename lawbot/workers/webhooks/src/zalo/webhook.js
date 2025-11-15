/**
 * Zalo Webhook Handler
 * Main entry point for Zalo OA webhook events
 */
import { verifyZaloSignature } from './verifier';
import { ZaloMonitor } from './monitor';
/**
 * Handle Zalo webhook POST request
 *
 * @param c - Hono context
 * @returns Response
 */
export async function handleZaloWebhook(c) {
    const startTime = Date.now();
    const monitoringCtx = ZaloMonitor.createContext(c.req.raw);
    try {
        // Get signature from header
        const signature = c.req.header('X-ZEvent-Signature');
        if (!signature) {
            console.warn('Missing signature header');
            return c.json({ error: 'Missing signature' }, 401);
        }
        // Get raw body
        const body = await c.req.text();
        if (!body) {
            console.warn('Empty request body');
            return c.json({ error: 'Empty body' }, 400);
        }
        // Verify signature
        const isValid = await verifyZaloSignature(body, signature, c.env.ZALO_APP_SECRET);
        if (!isValid) {
            console.warn('Invalid signature');
            await ZaloMonitor.logWebhookEvent('user_send_text', undefined, { error: 'Invalid signature', ip: monitoringCtx.ip }, c.env.DB);
            return c.json({ error: 'Invalid signature' }, 401);
        }
        // Parse webhook event
        const event = JSON.parse(body);
        // Log webhook event
        await ZaloMonitor.logWebhookEvent(event.event_name, event.sender?.id, event, c.env.DB);
        // Handle different event types
        await handleEvent(event, c.env, monitoringCtx);
        // Track processing time
        await ZaloMonitor.trackProcessingTime(startTime, event.event_name);
        // Zalo requires 200 OK response
        return c.json({ received: true, event: event.event_name }, 200);
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        await ZaloMonitor.logError(error, {
            requestId: monitoringCtx.requestId,
            processingTime: Date.now() - startTime,
        }, c.env.DB);
        // Still return 200 to prevent Zalo from retrying
        return c.json({ received: true, error: 'Processing error' }, 200);
    }
}
/**
 * Handle webhook event based on type
 *
 * @param event - Webhook event
 * @param env - Environment bindings
 * @param ctx - Monitoring context
 */
async function handleEvent(event, env, _ctx) {
    const userId = event.sender?.id || event.user_id_by_app;
    if (!userId) {
        console.warn('No user ID in event:', event);
        return;
    }
    switch (event.event_name) {
        case 'user_send_text':
            await handleTextMessage(event, userId, env);
            break;
        case 'user_send_image':
            await handleImageMessage(event, userId, env);
            break;
        case 'user_send_audio':
            await handleAudioMessage(event, userId, env);
            break;
        case 'user_send_video':
        case 'user_send_file':
        case 'user_send_sticker':
        case 'user_send_link':
        case 'user_send_location':
            await handleUnsupportedMessage(event, userId, env);
            break;
        case 'follow':
            await handleUserFollow(event, userId, env);
            break;
        case 'unfollow':
            await handleUserUnfollow(event, userId, env);
            break;
        default:
            console.log('Unknown event type:', event.event_name);
    }
}
/**
 * Handle text message event
 */
async function handleTextMessage(event, userId, env) {
    const text = event.message?.text;
    if (!text) {
        console.warn('No text in message event');
        return;
    }
    // Check syntax filter (optional: only process messages starting with #)
    if (env.ZALO_SYNTAX_FILTER === 'true' && !text.startsWith('#')) {
        console.log('Message filtered by syntax filter:', text);
        return;
    }
    // Remove # prefix if present
    const cleanText = text.startsWith('#') ? text.substring(1).trim() : text;
    // Queue message for processing (in production, use Queue)
    // For now, we'll process inline but this should be async
    const queueMessage = {
        type: 'message',
        userId,
        text: cleanText,
        timestamp: event.timestamp,
        platform: 'zalo',
    };
    // In production: await env.ZALO_QUEUE.send(queueMessage);
    // For now, store in KV for async processing
    await env.WEBHOOK_CACHE.put(`zalo_msg_${userId}_${Date.now()}`, JSON.stringify(queueMessage), {
        expirationTtl: 3600, // 1 hour
    });
}
/**
 * Handle image message event
 */
async function handleImageMessage(event, userId, env) {
    const attachments = event.message?.attachments;
    if (!attachments || attachments.length === 0) {
        console.warn('No attachments in image message');
        return;
    }
    // Queue for processing
    const queueMessage = {
        type: 'message',
        userId,
        text: '[Hình ảnh] - Xử lý hình ảnh chưa được hỗ trợ',
        timestamp: event.timestamp,
        platform: 'zalo',
        attachments: attachments.map((a) => ({
            type: a.type,
            url: a.payload.url || '',
        })),
    };
    await env.WEBHOOK_CACHE.put(`zalo_msg_${userId}_${Date.now()}`, JSON.stringify(queueMessage), {
        expirationTtl: 3600,
    });
}
/**
 * Handle audio message event
 */
async function handleAudioMessage(event, userId, env) {
    const attachments = event.message?.attachments;
    // Queue for processing
    const queueMessage = {
        type: 'message',
        userId,
        text: '[Âm thanh] - Xử lý âm thanh chưa được hỗ trợ',
        timestamp: event.timestamp,
        platform: 'zalo',
        attachments: attachments?.map((a) => ({
            type: a.type,
            url: a.payload.url || '',
        })),
    };
    await env.WEBHOOK_CACHE.put(`zalo_msg_${userId}_${Date.now()}`, JSON.stringify(queueMessage), {
        expirationTtl: 3600,
    });
}
/**
 * Handle unsupported message types
 */
async function handleUnsupportedMessage(_event, _userId, _env) {
    console.log('Unsupported message type:', _event.event_name);
    // Optionally send a message to user about unsupported type
}
/**
 * Handle user follow event
 */
async function handleUserFollow(event, userId, env) {
    const queueMessage = {
        type: 'follow',
        userId,
        timestamp: event.timestamp,
        platform: 'zalo',
    };
    await env.WEBHOOK_CACHE.put(`zalo_follow_${userId}_${Date.now()}`, JSON.stringify(queueMessage), {
        expirationTtl: 3600,
    });
}
/**
 * Handle user unfollow event
 */
async function handleUserUnfollow(event, userId, env) {
    const queueMessage = {
        type: 'unfollow',
        userId,
        timestamp: event.timestamp,
        platform: 'zalo',
    };
    await env.WEBHOOK_CACHE.put(`zalo_unfollow_${userId}_${Date.now()}`, JSON.stringify(queueMessage), {
        expirationTtl: 3600,
    });
}
