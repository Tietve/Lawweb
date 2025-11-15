/**
 * Facebook Queue Consumer
 * Handles queue consumer export for Cloudflare Workers
 */

import { processFacebookQueue } from './queue';
import type { Env } from './types';

/**
 * Queue consumer export for wrangler.toml
 * This function is called by Cloudflare Workers when processing queue messages
 */
export default {
  async queue(
    batch: MessageBatch<{
      object: string;
      entries: Array<{
        id: string;
        time: number;
        messaging?: unknown[];
        standby?: unknown[];
      }>;
    }>,
    env: Env
  ): Promise<void> {
    await processFacebookQueue(batch, env);
  },
};
