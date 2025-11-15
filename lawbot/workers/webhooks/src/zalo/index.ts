/**
 * Zalo Integration Module
 * Exports all Zalo-related functionality
 */

export { ZaloClient, createZaloClient } from './client';
export { verifyZaloSignature } from './verifier';
export {
  messageTemplates,
  formatLegalResponse,
  formatErrorMessage,
  createQuickReplies,
  getCategorySelectionMessage,
  getWelcomeMessage,
} from './templates';
export { handleZaloWebhook } from './webhook';
export { processZaloMessage, processBatch } from './queue';
export {
  getOrCreateUser,
  getOrCreateConversation,
  storeMessage,
} from './users';
export { ZaloMonitor, ensureWebhookLogsTable } from './monitor';
export type { MonitoringContext } from './monitor';
