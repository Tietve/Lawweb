/**
 * Zalo Message Queue Processor
 * Process incoming messages asynchronously
 */

import type { QueueMessage } from '@lawbot/shared';
import { ZaloClient } from './client';
import { getOrCreateUser, getOrCreateConversation, storeMessage } from './users';
import {
  formatLegalResponse,
  formatErrorMessage,
  getWelcomeMessage,
  getCategorySelectionMessage,
} from './templates';
import { ZaloMonitor } from './monitor';

/**
 * Environment bindings for queue processor
 */
interface QueueEnv {
  DB: D1Database;
  CHATBOT: Fetcher;
  WEBHOOK_CACHE: KVNamespace;
  ZALO_APP_ID: string;
  ZALO_APP_SECRET: string;
  ZALO_OA_ID: string;
  ZALO_SYNTAX_FILTER?: string;
}

/**
 * Process Zalo message from queue
 *
 * @param message - Queue message
 * @param env - Environment bindings
 */
export async function processZaloMessage(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const startTime = Date.now();

  try {
    // Create Zalo client
    const zaloClient = new ZaloClient(
      env.ZALO_APP_ID,
      env.ZALO_APP_SECRET,
      env.ZALO_OA_ID,
      env.WEBHOOK_CACHE
    );

    // Process based on message type
    switch (message.type) {
      case 'message':
        await processUserMessage(message, zaloClient, env);
        break;
      case 'follow':
        await processUserFollow(message, zaloClient, env);
        break;
      case 'unfollow':
        await processUserUnfollow(message, env);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }

    // Track processing time
    await ZaloMonitor.trackProcessingTime(startTime, 'user_send_text');
  } catch (error) {
    console.error('Error processing queue message:', error);
    await ZaloMonitor.logError(
      error as Error,
      { message, processingTime: Date.now() - startTime },
      env.DB
    );
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Process user text message
 *
 * @param message - Queue message
 * @param client - Zalo client
 * @param env - Environment bindings
 */
async function processUserMessage(
  message: QueueMessage,
  client: ZaloClient,
  env: QueueEnv
): Promise<void> {
  const { userId, text, platform } = message;

  if (!text) {
    console.warn('No text in message:', message);
    return;
  }

  try {
    // Send typing indicator
    await client.sendTypingIndicator(userId);

    // Get or create user
    const user = await getOrCreateUser(userId, platform, env.DB, client);

    // Get or create conversation
    const conversationId = await getOrCreateConversation(
      user.id,
      platform,
      env.DB
    );

    // Store user message
    await storeMessage(conversationId, 'user', text, null, env.DB);

    // Get AI response from chatbot worker
    const aiResponse = await env.CHATBOT.fetch(
      new Request('https://chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          conversationId,
          message: text,
          platform: 'zalo',
        }),
      })
    );

    if (!aiResponse.ok) {
      throw new Error(`Chatbot error: ${aiResponse.status}`);
    }

    const response = (await aiResponse.json()) as {
      answer?: string;
      message?: string;
      citations?: Array<{ law: string; article: string; relevance?: number }>;
      suggestions?: string[];
    };

    // Format response with citations
    const formattedMessage = formatLegalResponse(
      response.answer || response.message || 'Xin lỗi, không thể tạo phản hồi.',
      response.citations || []
    );

    // Store assistant message
    await storeMessage(
      conversationId,
      'assistant',
      formattedMessage,
      response.citations ? JSON.stringify(response.citations) : null,
      env.DB
    );

    // Send response to user
    await client.sendMessage(userId, formattedMessage);

    // Send quick replies if suggestions available
    if (response.suggestions && Array.isArray(response.suggestions) && response.suggestions.length > 0) {
      const quickReplies = response.suggestions.slice(0, 5).map((s) => ({
        title: s.length > 20 ? s.substring(0, 17) + '...' : s,
        payload: `q_${s.substring(0, 30)}`,
      }));

      await client.sendQuickReply(
        userId,
        'Bạn có thể hỏi thêm về:',
        quickReplies
      );
    }
  } catch (error) {
    console.error('Error in processUserMessage:', error);

    // Send error message to user
    try {
      await client.sendMessage(userId, formatErrorMessage('generalError'));
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }

    throw error;
  }
}

/**
 * Process user follow event (new subscriber)
 *
 * @param message - Queue message
 * @param client - Zalo client
 * @param env - Environment bindings
 */
async function processUserFollow(
  message: QueueMessage,
  client: ZaloClient,
  env: QueueEnv
): Promise<void> {
  const { userId, platform } = message;

  try {
    // Get or create user
    await getOrCreateUser(userId, platform, env.DB, client);

    // Send welcome message
    const welcomeMsg = getWelcomeMessage();
    await client.sendMessage(userId, welcomeMsg);

    // Send category selection
    const categoryMsg = getCategorySelectionMessage();
    await client.sendQuickReply(userId, categoryMsg.text, categoryMsg.quickReplies);

    // Log event
    await ZaloMonitor.logWebhookEvent('follow', userId, { userId }, env.DB);
  } catch (error) {
    console.error('Error in processUserFollow:', error);
    throw error;
  }
}

/**
 * Process user unfollow event
 *
 * @param message - Queue message
 * @param env - Environment bindings
 */
async function processUserUnfollow(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const { userId } = message;

  try {
    // Archive user's conversations
    await env.DB
      .prepare(
        `
      UPDATE conversations
      SET status = 'archived', updated_at = unixepoch()
      WHERE user_id = ? AND status = 'active'
    `
      )
      .bind(userId)
      .run();

    // Log event
    await ZaloMonitor.logWebhookEvent('unfollow', userId, { userId }, env.DB);
  } catch (error) {
    console.error('Error in processUserUnfollow:', error);
    // Don't throw - unfollow should not fail silently
  }
}

/**
 * Batch process messages (for Queue consumer)
 *
 * @param batch - Message batch
 * @param env - Environment bindings
 */
export async function processBatch(
  batch: { messages: Array<{ body: QueueMessage; retry: () => void; ack: () => void }> },
  env: QueueEnv
): Promise<void> {
  for (const msg of batch.messages) {
    try {
      await processZaloMessage(msg.body, env);
      msg.ack();
    } catch (error) {
      console.error('Error processing message, will retry:', error);
      msg.retry();
    }
  }
}
