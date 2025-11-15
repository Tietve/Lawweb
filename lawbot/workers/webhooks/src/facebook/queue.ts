/**
 * Facebook Messenger Queue Processor
 * Process webhook events asynchronously
 */

import { MessengerClient } from './client';
import { handleMessage, handlePostback } from './handlers';
import type { MessengerWebhookEntry, MessagingEvent, Env } from './types';

/**
 * Process a batch of Facebook webhook events from queue
 * This is called by Cloudflare Queue consumer
 */
export async function processFacebookQueue(
  batch: MessageBatch<{
    object: string;
    entries: MessengerWebhookEntry[];
  }>,
  env: Env
): Promise<void> {
  const client = new MessengerClient(env.MESSENGER_PAGE_ACCESS_TOKEN);

  for (const message of batch.messages) {
    const data = message.body;

    try {
      if (data.object !== 'page') {
        console.log('Ignoring non-page webhook:', data.object);
        message.ack();
        continue;
      }

      // Process each entry
      for (const entry of data.entries) {
        await processEntry(entry, client, env);
      }

      // Acknowledge successful processing
      message.ack();
    } catch (error) {
      console.error('Error processing Facebook queue message:', error);

      // Retry logic: max 3 attempts with exponential backoff
      if (message.attempts < 3) {
        const delaySeconds = 30 * Math.pow(2, message.attempts - 1);
        message.retry({ delaySeconds });
        console.log(
          `Retrying message, attempt ${message.attempts + 1}, delay: ${delaySeconds}s`
        );
      } else {
        // Max retries exceeded, log and ack to prevent infinite retries
        console.error('Max retries exceeded for message:', data);
        message.ack();

        // TODO: Send to dead letter queue or log for manual review
      }
    }
  }
}

/**
 * Process a single webhook entry
 */
async function processEntry(
  entry: MessengerWebhookEntry,
  client: MessengerClient,
  env: Env
): Promise<void> {
  // Handle messaging events (when bot is primary receiver)
  if (entry.messaging && entry.messaging.length > 0) {
    for (const event of entry.messaging) {
      await processMessagingEvent(event, client, env);
    }
  }

  // Handle standby events (when bot is not primary receiver)
  if (entry.standby && entry.standby.length > 0) {
    console.log('Standby events:', entry.standby);
    // Bot is in standby mode, just log for now
  }
}

/**
 * Process a single messaging event
 */
async function processMessagingEvent(
  event: MessagingEvent,
  client: MessengerClient,
  env: Env
): Promise<void> {
  const senderId = event.sender.id;

  try {
    // Mark message as seen
    await client.sendMarkSeen(senderId);

    // Route to appropriate handler
    if (event.message) {
      await handleMessage(event, client, env);
    } else if (event.postback) {
      await handlePostback(event, client, env);
    } else {
      console.log('Unknown event type:', event);
    }
  } catch (error) {
    console.error('Error processing messaging event:', error);
    throw error; // Re-throw to trigger retry logic
  }
}

/**
 * Process webhook event directly (without queue)
 * Used when queue is not available or for immediate processing
 */
export async function processWebhookDirectly(
  body: {
    object: string;
    entry: MessengerWebhookEntry[];
  },
  env: Env
): Promise<void> {
  const client = new MessengerClient(env.MESSENGER_PAGE_ACCESS_TOKEN);

  if (body.object !== 'page') {
    console.log('Ignoring non-page webhook:', body.object);
    return;
  }

  // Process each entry
  for (const entry of body.entry) {
    await processEntry(entry, client, env);
  }
}

/**
 * Queue webhook event for asynchronous processing
 */
export async function queueWebhookEvent(
  body: {
    object: string;
    entry: MessengerWebhookEntry[];
  },
  env: Env
): Promise<void> {
  if (!env.FB_QUEUE) {
    console.warn('FB_QUEUE not configured, processing directly');
    await processWebhookDirectly(body, env);
    return;
  }

  // Queue the webhook event
  await env.FB_QUEUE.send({
    object: body.object,
    entries: body.entry,
  });

  console.log(`Queued ${body.entry.length} webhook entries`);
}
