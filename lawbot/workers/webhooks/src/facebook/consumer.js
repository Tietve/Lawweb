/**
 * Facebook Queue Consumer
 * Handles queue consumer export for Cloudflare Workers
 */
import { processFacebookQueue } from './queue';
/**
 * Queue consumer export for wrangler.toml
 * This function is called by Cloudflare Workers when processing queue messages
 */
export default {
    async queue(batch, env) {
        await processFacebookQueue(batch, env);
    },
};
